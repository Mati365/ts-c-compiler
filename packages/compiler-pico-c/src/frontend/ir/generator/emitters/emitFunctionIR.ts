import {GroupTreeVisitor} from '@compiler/grammar/tree/TreeGroupedVisitor';
import {CFunctionDeclType} from '@compiler/pico-c/frontend/analyze';
import {
  ASTCAssignmentExpression, ASTCCompilerKind,
  ASTCCompilerNode, ASTCDeclaration, ASTCExpressionStatement, ASTCFunctionDefinition,
} from '@compiler/pico-c/frontend/parser';

import {IRRetInstruction} from '../../instructions';
import {
  appendStmtResults,
  createBlankStmtResult,
  IREmitterContextAttrs,
  IREmitterStmtResult,
} from './types';

import {emitAssignmentIR} from './emitAssignmentIR';
import {emitDeclarationIR} from './emitDeclarationIR';
import {emitExpressionStmtIR} from './emitExpressionStmtIR';

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
  const result = createBlankStmtResult(
    [
      context.allocator.allocFunctionType(<CFunctionDeclType> node.type),
    ],
  );

  const {instructions} = result;
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

          appendStmtResults(declarationResult, result);
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

          appendStmtResults(assignResult, result);
          return false;
        },
      },
      [ASTCCompilerKind.ExpressionStmt]: {
        enter(expressionNode: ASTCExpressionStatement) {
          const assignResult = emitExpressionStmtIR(
            {
              node: expressionNode,
              scope,
              context,
            },
          );

          appendStmtResults(assignResult, result);
          return false;
        },
      },
    },
  )(node.content);

  instructions.push(new IRRetInstruction);

  return result;
}
