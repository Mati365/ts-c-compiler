import * as R from 'ramda';

import { isCompilerTreeNode } from 'frontend/parser';
import {
  CPointerType,
  CVariableInitializerTree,
  isInitializerTreeValue,
} from 'frontend/analyze';

import {
  appendStmtResults,
  createBlankStmtResult,
  IREmitterContextAttrs,
  IREmitterStmtResult,
} from '../types';

import { IRError, IRErrorCode } from '../../../errors/IRError';
import { IRStoreInstruction } from '../../../instructions';
import { IRConstant, IRVariable, isIRVariable } from '../../../variables';

import { emitExpressionIR } from '../emit-expr';
import {
  emitStringLiteralBlobLocalInitializerIR,
  emitStringLiteralPtrInitializerIR,
  StringPtrInitializerLocalIREmitAttrs,
} from './literal';

import { shouldEmitStringPtrInitializer } from './literal/shouldEmitStringPtrInitializer';
import { getBaseTypeIfPtr } from 'frontend/analyze/types/utils';

type LoadInitializerIREmitAttrs = IREmitterContextAttrs & {
  initializerTree: CVariableInitializerTree;
  destVar: IRVariable;
};

/**
 * Emits initializer
 */
export function emitVariableLoadInitializerIR({
  destVar,
  initializerTree,
  scope,
  context,
}: LoadInitializerIREmitAttrs): IREmitterStmtResult {
  const result = createBlankStmtResult();
  const isDestUnion = getBaseTypeIfPtr(destVar.type).isUnion();

  let offset: number = 0;

  initializerTree.fields.forEach((pair, index) => {
    const initializer = pair?.value;

    if (isInitializerTreeValue(initializer)) {
      throw new IRError(IRErrorCode.INCORRECT_INITIALIZER_BLOCK);
    }

    const itemOffsetType =
      pair?.type ?? initializerTree.getIndexExpectedType(index);

    if (R.is(String, initializer)) {
      const attrs: StringPtrInitializerLocalIREmitAttrs = {
        context,
        literal: initializer,
        initializerMeta: {
          offset,
          destVar,
        },
      };

      if (shouldEmitStringPtrInitializer(destVar.type)) {
        // const char* str2[] = { "Hello world2!", "Hello world2!", 0x5 };
        // const char* HELLO_WORLD2 = "Hello world2!";
        appendStmtResults(emitStringLiteralPtrInitializerIR(attrs), result);

        offset += itemOffsetType.getByteSize();
      } else {
        appendStmtResults(
          emitStringLiteralBlobLocalInitializerIR(attrs),
          result,
        );

        offset += initializer.length;
      }
    } else {
      if (isCompilerTreeNode(initializer)) {
        const exprResult = emitExpressionIR({
          scope,
          context,
          node: initializer,
          initializerMeta: {
            offset,
            destVar,
            index,
          },
        });

        appendStmtResults(exprResult, result);

        // do not emit store if RVO optimized fn call result is present
        if (
          !isIRVariable(exprResult.output) ||
          !destVar.isShallowEqual(exprResult.output)
        ) {
          result.instructions.push(
            new IRStoreInstruction(exprResult.output, destVar, offset),
          );
        }
      } else if (!R.isNil(initializer)) {
        // int abc[3] = { 1, 2, 3}
        // constant literals are of type 1
        result.instructions.push(
          new IRStoreInstruction(
            IRConstant.ofConstant(itemOffsetType, initializer),
            isDestUnion
              ? destVar.ofType(CPointerType.ofType(itemOffsetType))
              : destVar,
            offset,
          ),
        );
      }

      offset += itemOffsetType.getByteSize();
    }
  });

  return result;
}
