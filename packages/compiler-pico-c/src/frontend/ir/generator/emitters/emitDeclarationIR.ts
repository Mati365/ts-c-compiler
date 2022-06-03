import {GroupTreeVisitor} from '@compiler/grammar/tree/TreeGroupedVisitor';
import {
  ASTCCompilerKind,
  ASTCCompilerNode,
  ASTCDeclaration,
  ASTCDirectDeclarator,
} from '@compiler/pico-c/frontend/parser';

import {IREmitterContextAttrs, IREmitterStmtResult} from './types';
import {CIRInstruction} from '../../instructions';

import {emitVariableInitializerIR} from './emitVariableInitializerIR';

type FunctionIREmitAttrs = IREmitterContextAttrs & {
  node: ASTCDeclaration;
};

export function emitDeclarationIR(
  {
    context,
    scope,
    node,
  }: FunctionIREmitAttrs,
): IREmitterStmtResult {
  const instructions: CIRInstruction[] = [];

  GroupTreeVisitor.ofIterator<ASTCCompilerNode>(
    {
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

          instructions.push(...initializerResult.instructions);
        },
      },
    },
  )(node);

  return {
    instructions,
  };
}
