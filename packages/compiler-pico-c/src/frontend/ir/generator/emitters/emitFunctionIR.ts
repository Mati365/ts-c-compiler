import {GroupTreeVisitor} from '@compiler/grammar/tree/TreeGroupedVisitor';
import {CFunctionDeclType} from '@compiler/pico-c/frontend/analyze';
import {
  ASTCAssignmentExpression, ASTCCompilerKind,
  ASTCCompilerNode, ASTCDeclaration, ASTCFunctionDefinition,
} from '@compiler/pico-c/frontend/parser';

import {IRInstruction, IRRetInstruction} from '../../instructions';
import {IREmitterContextAttrs, IREmitterStmtResult} from './types';

import {emitAssignmentIR} from './emitAssignmentIR';
import {emitDeclarationIR} from './emitDeclarationIR';

type FunctionIREmitAttrs = IREmitterContextAttrs & {
  node: ASTCFunctionDefinition;
};

export function emitFunctionIR(
  {
    context,
    scope,
    node,
  }: FunctionIREmitAttrs,
): IREmitterStmtResult {
  const instructions: IRInstruction[] = [
    context.allocator.allocFunctionType(<CFunctionDeclType> node.type),
  ];

  GroupTreeVisitor.ofIterator<ASTCCompilerNode>(
    {
      [ASTCCompilerKind.ReturnStmt]: false,
      [ASTCCompilerKind.Declaration]: {
        enter(declarationNode: ASTCDeclaration) {
          const declarationResult = emitDeclarationIR(
            {
              node: declarationNode,
              scope,
              context,
            },
          );

          instructions.push(...declarationResult.instructions);
          return false;
        },
      },
      [ASTCCompilerKind.AssignmentExpression]: {
        enter(assignmentNode: ASTCAssignmentExpression) {
          if (!assignmentNode.isOperatorExpression())
            return;

          const assignResult = emitAssignmentIR(
            {
              node: assignmentNode,
              scope,
              context,
            },
          );

          instructions.push(...assignResult.instructions);
          return false;
        },
      },
    },
  )(node.content);

  instructions.push(new IRRetInstruction);

  return {
    instructions,
  };
}
