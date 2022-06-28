import {GroupTreeVisitor} from '@compiler/grammar/tree/TreeGroupedVisitor';
import {
  ASTCAssignmentExpression, ASTCBlockItemsList, ASTCCompilerKind,
  ASTCCompilerNode, ASTCDeclaration, ASTCExpression,
  ASTCExpressionStatement,
} from '@compiler/pico-c/frontend/parser';

import {IRFnDeclInstruction, IRRetInstruction} from '../../../instructions';
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

type BlockItemIREmitAttrs = IREmitterContextAttrs & {
  node: ASTCCompilerNode;
  fnDecl: IRFnDeclInstruction;
};

export function emitBlockItemIR(
  {
    fnDecl,
    context,
    scope,
    node,
  }: BlockItemIREmitAttrs,
): IREmitterStmtResult {
  let result = createBlankStmtResult();

  GroupTreeVisitor.ofIterator<ASTCCompilerNode>(
    {
      [ASTCCompilerKind.BlockItemList]: {
        enter(blockItemNode: ASTCBlockItemsList) {
          if (!blockItemNode.scope)
            return;

          const nestedContext = {
            ...context,
            allocator: context.allocator.ofNestedScopePrefix(),
          };

          blockItemNode.children?.forEach((child) => {
            appendStmtResults(
              emitBlockItemIR(
                {
                  fnDecl,
                  context: nestedContext,
                  scope: blockItemNode.scope,
                  node: child,
                },
              ),
              result,
            );
          });

          context.allocator.assignIRAllocatorData(nestedContext.allocator);
          return false;
        },
      },

      [ASTCCompilerKind.ReturnStmt]: {
        enter(expr: ASTCExpression) {
          const canBeStoredInReg = fnDecl.type.returnType.canBeStoredInIntegralReg();
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
  )(node);

  return result;
}
