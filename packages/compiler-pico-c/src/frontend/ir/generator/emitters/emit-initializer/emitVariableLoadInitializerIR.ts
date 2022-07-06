import * as R from 'ramda';

import {isCompilerTreeNode} from '@compiler/pico-c/frontend/parser';
import {
  CVariableInitializerTree,
  isInitializerTreeValue,
} from '@compiler/pico-c/frontend/analyze';

import {appendStmtResults, createBlankStmtResult, IREmitterContextAttrs, IREmitterStmtResult} from '../types';
import {IRError, IRErrorCode} from '../../../errors/IRError';
import {IRStoreInstruction} from '../../../instructions';
import {IRConstant, IRVariable, isIRVariable} from '../../../variables';

import {emitExpressionIR} from '../emit-expr';

type LoadInitializerIREmitAttrs = IREmitterContextAttrs & {
  initializerTree: CVariableInitializerTree;
  destVar: IRVariable;
};

/**
 * Emits initializer
 */
export function emitVariableLoadInitializerIR(
  {
    destVar,
    initializerTree,
    scope,
    context,
  }: LoadInitializerIREmitAttrs,
): IREmitterStmtResult {
  const {allocator} = context;
  const result = createBlankStmtResult();

  let offset: number = 0;

  initializerTree.fields.forEach((initializer, index) => {
    if (isInitializerTreeValue(initializer))
      throw new IRError(IRErrorCode.INCORRECT_INITIALIZER_BLOCK);

    const initializerType = initializerTree.getIndexExpectedType(index);

    if (isCompilerTreeNode(initializer)) {
      const exprResult = emitExpressionIR(
        {
          scope,
          context,
          node: initializer,
          initializerMeta: {
            offset,
            destVar,
            index,
          },
        },
      );

      appendStmtResults(exprResult, result);

      // do not emit store if RVO optimized fn call result is present
      if (!isIRVariable(exprResult.output) || !destVar.isShallowEqual(exprResult.output)) {
        result.instructions.push(
          new IRStoreInstruction(exprResult.output, destVar, offset),
        );
      }
    } else if (R.is(String, initializer)) {
      const argVar = allocator.getVariable(initializer);

      result.instructions.push(
        new IRStoreInstruction(argVar, destVar, offset),
      );
    } else if (!R.isNil(initializer)) {
      // int abc[3] = { 1, 2, 3}
      // constant literals are of type 1
      result.instructions.push(
        new IRStoreInstruction(
          IRConstant.ofConstant(initializerType, initializer),
          destVar,
          offset,
        ),
      );
    }

    offset += initializerType.getByteSize();
  });

  return result;
}
