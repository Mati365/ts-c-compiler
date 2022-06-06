import {checkLeftTypeOverlapping} from '@compiler/pico-c/frontend/analyze/checker';

import {CArrayType, CVariable, isArrayLikeType} from '@compiler/pico-c/frontend/analyze';
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
  const rootIRVar = allocator.allocVariable(variable);

  instructions.push(
    new IRAllocInstruction(rootIRVar),
  );

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
      const dataType = CArrayType.ofFlattenDescriptor(
        {
          type: type.getSourceType(),
          dimensions: [initializer.fields.length],
        },
      );

      const constArrayVar = allocator.allocConstDataVariable(dataType);
      const tmpLeaAddressVar = allocator.allocTmpVariable(type);

      data.push(
        new IRDefConstInstruction(initializer, constArrayVar),
      );

      instructions.push(
        new IRLeaInstruction(constArrayVar, tmpLeaAddressVar),
        new IRStoreInstruction(tmpLeaAddressVar, rootIRVar),
      );
    } else {
      instructions.push(
        ...emitVariableLoadInitializerIR(
          {
            scope,
            context,
            variable,
            rootIRVar,
          },
        ),
      );
    }
  }

  return result;
}
