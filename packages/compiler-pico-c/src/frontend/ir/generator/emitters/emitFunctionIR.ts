import * as R from 'ramda';

import {GroupTreeVisitor} from '@compiler/grammar/tree/TreeGroupedVisitor';
import {CFunctionDeclType} from '@compiler/pico-c/frontend/analyze';
import {
  ASTCAssignmentExpression, ASTCCompilerKind,
  ASTCCompilerNode, ASTCDeclaration, ASTCExpression,
  ASTCExpressionStatement, ASTCFunctionDefinition,
} from '@compiler/pico-c/frontend/parser';

import {IRRetInstruction, isIRRetInstruction} from '../../instructions';
import {
  appendStmtResults,
  createBlankStmtResult,
  IREmitterContextAttrs,
  IREmitterStmtResult,
} from './types';

import {emitAssignmentIR} from './emitAssignmentIR';
import {emitDeclarationIR} from './emitDeclarationIR';
import {emitExpressionStmtIR} from './emitExpressionStmtIR';
import {emitExpressionIR} from './emitExpressionIR';

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

  GroupTreeVisitor.ofIterator<ASTCCompilerNode>(
    {
      [ASTCCompilerKind.ReturnStmt]: {
        enter(expr: ASTCExpression) {
          const assignResult = emitExpressionIR(
            {
              dropLeadingLoads: true,
              node: expr,
              scope,
              context,
            },
          );

          appendStmtResults(assignResult, result).instructions.push(
            new IRRetInstruction(assignResult.output),
          );

          return false;
        },
      },

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

  if (!isIRRetInstruction(R.last(result.instructions)))
    result.instructions.push(new IRRetInstruction);

  return result;
}
