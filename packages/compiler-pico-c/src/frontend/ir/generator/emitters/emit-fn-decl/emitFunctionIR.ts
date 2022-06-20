import * as R from 'ramda';

import {GroupTreeVisitor} from '@compiler/grammar/tree/TreeGroupedVisitor';
import {CFunctionDeclType} from '@compiler/pico-c/frontend/analyze';
import {
  ASTCAssignmentExpression, ASTCCompilerKind,
  ASTCCompilerNode, ASTCDeclaration, ASTCExpression,
  ASTCExpressionStatement, ASTCFunctionDefinition,
} from '@compiler/pico-c/frontend/parser';

import {IRRetInstruction, isIRRetInstruction} from '../../../instructions';
import {IRError, IRErrorCode} from '../../../errors/IRError';

import {
  appendStmtResults,
  createBlankStmtResult,
  IREmitterContextAttrs,
  IREmitterStmtResult,
} from '../types';

import {functionRvoStmtTransformer} from './functionRvoStmtTransformer';
import {isIRVariable} from '../../../variables';

import {emitAssignmentIR} from '../emitAssignmentIR';
import {emitDeclarationIR} from '../emitDeclarationIR';
import {emitExpressionStmtIR} from '../emitExpressionStmtIR';
import {emitExpressionIR} from '../emitExpressionIR';

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
  const fnType = <CFunctionDeclType> node.type;
  const fnDecl = context.allocator.allocFunctionType(fnType);
  let result = createBlankStmtResult([fnDecl]);

  GroupTreeVisitor.ofIterator<ASTCCompilerNode>(
    {
      [ASTCCompilerKind.ReturnStmt]: {
        enter(expr: ASTCExpression) {
          const canBeStoredInReg = fnType.returnType.canBeStoredInIntegralReg();
          let assignResult = emitExpressionIR(
            {
              node: expr,
              scope,
              context,
            },
          );

          appendStmtResults(assignResult, result);

          if (canBeStoredInReg) {
            result.instructions.push(
              new IRRetInstruction(assignResult.output),
            );
          } else {
            if (!isIRVariable(assignResult.output))
              throw new IRError(IRErrorCode.RVO_RETURN_CONSTANT);

            result = functionRvoStmtTransformer(
              {
                stmtResult: result,
                returnedVar: assignResult.output,
                rvoOutputVar: fnDecl.outputVarPtr,
              },
            );
            result.instructions.push(new IRRetInstruction);
          }

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
