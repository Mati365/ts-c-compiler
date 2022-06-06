import * as R from 'ramda';

import {isCompilerTreeNode} from '@compiler/pico-c/frontend/parser';
import {CVariable, isInitializerTreeValue} from '@compiler/pico-c/frontend/analyze';

import {IREmitterContextAttrs} from '../types';
import {IRError, IRErrorCode} from '../../../errors/IRError';
import {IRInstruction, IRStoreInstruction} from '../../../instructions';
import {IRConstant, IRVariable} from '../../../variables';

import {emitExpressionIR} from '../emitExpressionIR';

type LoadInitializerIREmitAttrs = IREmitterContextAttrs & {
  rootIRVar: IRVariable;
  variable: CVariable;
};

/**
 * Emits initializer
 */
export function emitVariableLoadInitializerIR(
  {
    rootIRVar,
    variable,
    scope,
    context,
  }: LoadInitializerIREmitAttrs,
): IRInstruction[] {
  const {allocator} = context;
  const instructions: IRInstruction[] = [];

  let offset: number = 0;

  variable.initializer.fields.forEach((initializer, index) => {
    if (isInitializerTreeValue(initializer))
      throw new IRError(IRErrorCode.INCORRECT_INITIALIZER_BLOCK);

    const initializerType = variable.initializer.getIndexExpectedType(index);
    if (isCompilerTreeNode(initializer)) {
      const exprResult = emitExpressionIR(
        {
          type: rootIRVar.type,
          node: initializer,
          scope,
          context,
        },
      );

      instructions.push(
        ...exprResult.instructions,
        new IRStoreInstruction(
          exprResult.output,
          rootIRVar,
          offset,
        ),
      );
    } else if (R.is(String, initializer)) {
      const argVar = allocator.getVariable(initializer);

      instructions.push(
        new IRStoreInstruction(
          argVar,
          rootIRVar,
          offset,
        ),
      );
    } else if (!R.isNil(initializer)) {
      // int abc[3] = { 1, 2, 3}
      // constant literals are of type 1
      instructions.push(
        new IRStoreInstruction(
          IRConstant.ofConstant(initializerType, initializer),
          rootIRVar,
          offset,
        ),
      );
    }

    offset += initializerType.getByteSize();
  });

  return instructions;
}
