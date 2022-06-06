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

const MIN_PTR_ARRAY_INITIALIZED_FIELDS_COUNT = 2;

type InitializerIREmitAttrs = IREmitterContextAttrs & {
  variable: CVariable;
};

/**
 * @todo
 * Emit initializers for arrays with <= 3 directly.
 * If there is >= 3 emit only pointer to labeled value such as:
 *
 * array = &(label)
 * label:
 *  db 5
 *  db 8
 *  db 9
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
      const ptrType = CPointerType.ofArray(config.arch, <CArrayType> type);
      const dataType = CArrayType.ofFlattenDescriptor(
        {
          type: type.getSourceType(),
          dimensions: [initializer.fields.length],
        },
      );

      const rootIRVar = allocator.allocVariablePointer(
        IRVariable
          .ofScopeVariable(variable.ofType(ptrType))
          .ofVirtualArrayPtr(),
      );

      const constArrayVar = allocator.allocConstDataVariable(dataType);
      const tmpLeaAddressVar = allocator.allocAddressVariable();

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
