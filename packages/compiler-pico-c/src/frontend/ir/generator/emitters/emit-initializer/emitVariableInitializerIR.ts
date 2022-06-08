import {checkLeftTypeOverlapping} from '@compiler/pico-c/frontend/analyze/checker';

import {
  CArrayType, CPointerType,
  CVariable, isArrayLikeType,
} from '@compiler/pico-c/frontend/analyze';

import {IRVariable} from '../../../variables';
import {
  IRAllocInstruction,
  IRDefConstInstruction,
  IRLeaInstruction,
  IRStoreInstruction,
} from '../../../instructions';

import {
  IREmitterContextAttrs,
  IREmitterStmtResult,
  createBlankStmtResult,
} from '../types';

import {emitVariableLoadInitializerIR} from './emitVariableLoadInitializerIR';

const MIN_PTR_ARRAY_INITIALIZED_FIELDS_COUNT = 4;

type InitializerIREmitAttrs = IREmitterContextAttrs & {
  variable: CVariable;
};

/**
 * Emits array initializer and when array size is bigger
 * than specified in constant emits pointer to data segment
 *
 * @example
 *  array = &(label)
 *  label:
 *    db 1, 2, 3, 4
 */
export function emitVariableInitializerIR(
  {
    scope,
    context,
    variable,
  }: InitializerIREmitAttrs,
): IREmitterStmtResult {
  const {allocator, config} = context;
  const result: IREmitterStmtResult = createBlankStmtResult();

  const {instructions, data} = result;
  const {type, initializer} = variable;

  if (variable.isInitialized()) {
    const isArrayType = isArrayLikeType(type);
    const isStringType = checkLeftTypeOverlapping(
      type,
      CArrayType.ofStringLiteral(config.arch),
      {
        implicitCast: false,
        ignoreConstChecks: true,
      },
    );

    if ((isStringType || isArrayType)
        && initializer.hasOnlyConstantExpressions()
        && initializer.getInitializedFieldsCount() > MIN_PTR_ARRAY_INITIALIZED_FIELDS_COUNT) {
      // initializer with const expressions
      const arrayPtrType = CPointerType.ofArray(config.arch, <CArrayType> type);
      const dataType = CArrayType.ofFlattenDescriptor(
        {
          type: type.getSourceType(),
          dimensions: [initializer.fields.length],
        },
      );

      const rootIRVar = allocator.allocVariablePointer(
        IRVariable
          .ofScopeVariable(variable.ofType(arrayPtrType))
          .ofVirtualArrayPtr(),
      );

      const constArrayVar = allocator.allocConstDataVariable(dataType);
      const tmpLeaAddressVar = allocator.allocTmpVariable(arrayPtrType);

      data.push(
        new IRDefConstInstruction(initializer, constArrayVar),
      );

      instructions.push(
        IRAllocInstruction.ofDestPtrVariable(rootIRVar),
        new IRLeaInstruction(constArrayVar, tmpLeaAddressVar),
        new IRStoreInstruction(tmpLeaAddressVar, rootIRVar),
      );
    } else {
      // initializer with expressions
      const rootIRVar = allocator.allocVariablePointer(variable);

      instructions.push(
        IRAllocInstruction.ofDestPtrVariable(rootIRVar),
        ...emitVariableLoadInitializerIR(
          {
            scope,
            context,
            initializerTree: initializer,
            destVariable: rootIRVar,
          },
        ),
      );
    }
  } else {
    // uninitialized variable
    const rootIRVar = allocator.allocVariablePointer(variable);

    instructions.push(
      IRAllocInstruction.ofDestPtrVariable(rootIRVar),
    );
  }

  return result;
}
