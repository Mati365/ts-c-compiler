import {GroupTreeVisitor} from '@compiler/grammar/tree/TreeGroupedVisitor';
import {
  ASTCCompilerKind,
  ASTCCompilerNode,
  ASTCDirectDeclarator,
} from '@compiler/pico-c/frontend/parser';

import {emitVariableInitializerIR} from './emit-initializer/emitVariableInitializerIR';
import {
  IREmitterContextAttrs,
  IREmitterStmtResult,
  createBlankStmtResult,
  appendStmtResults,
} from './types';

type FunctionIREmitAttrs = IREmitterContextAttrs & {
  node: ASTCCompilerNode;
};

export function emitDeclarationIR(
  {
    context,
    scope,
    node,
  }: FunctionIREmitAttrs,
): IREmitterStmtResult {
  const result = createBlankStmtResult();

  GroupTreeVisitor.ofIterator<ASTCCompilerNode>(
    {
      [ASTCCompilerKind.TypeSpecifier]: false,
      [ASTCCompilerKind.DirectDeclaratorFnExpression]: false,
      [ASTCCompilerKind.DirectDeclarator]: {
        enter(declaratorNode: ASTCDirectDeclarator) {
          if (!declaratorNode.isIdentifier())
            return;

          const variable = scope.findVariable(declaratorNode.identifier.text);
          const initializerResult = emitVariableInitializerIR(
            {
              context,
              scope,
              variable,
            },
          );

          appendStmtResults(initializerResult, result);
          return false;
        },
      },
    },
  )(node);

  return result;
}
