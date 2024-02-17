import { GroupTreeVisitor } from '@ts-cc/grammar';

import { CFunctionDeclType } from 'frontend/analyze';
import {
  ASTCAssignmentExpression,
  ASTCCompilerKind,
  ASTCCompilerNode,
} from 'frontend/parser';

import { IRInstructionTypedArg } from '../../../variables';
import { emitCastIR } from '../emitCastIR';
import {
  appendStmtResults,
  createBlankStmtResult,
  IREmitterContextAttrs,
} from '../types';

type FnArgsLoadIREmitAttrs = IREmitterContextAttrs & {
  node: ASTCCompilerNode;
  fnType: CFunctionDeclType;
};

export function emitFnArgsLoadIR({
  node,
  context,
  scope,
  fnType,
}: FnArgsLoadIREmitAttrs) {
  const { emit } = context;
  const result = createBlankStmtResult();
  const args: IRInstructionTypedArg[] = [];

  let argIndex = 0;

  GroupTreeVisitor.ofIterator<ASTCCompilerNode>({
    [ASTCCompilerKind.AssignmentExpression]: {
      enter(exprNode: ASTCAssignmentExpression) {
        const declArgType = fnType.args[argIndex]?.type;
        const exprResult = emit.expression({
          node: exprNode,
          context,
          scope,
        });

        appendStmtResults(exprResult, result);

        if (declArgType) {
          const castResult = emitCastIR({
            context,
            expectedType: declArgType,
            inputVar: exprResult.output,
          });

          appendStmtResults(castResult, result);
          exprResult.output = castResult.output;
        }

        args.push(exprResult.output);
        return false;
      },
    },
  })(node);

  return {
    ...result,
    args,
  };
}
