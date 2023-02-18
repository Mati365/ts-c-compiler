import { GroupTreeVisitor } from '@compiler/grammar/tree/TreeGroupedVisitor';
import {
  ASTCAssignmentExpression,
  ASTCBlockItemsList,
  ASTCCompilerKind,
  ASTCCompilerNode,
  ASTCDeclaration,
  ASTCDoWhileStatement,
  ASTCExpression,
  ASTCExpressionStatement,
  ASTCForStatement,
  ASTCIfStatement,
} from '@compiler/pico-c/frontend/parser';

import { IRRetInstruction } from '../../../instructions';
import { IRError, IRErrorCode } from '../../../errors/IRError';

import {
  appendStmtResults,
  createBlankStmtResult,
  IREmitterContextAttrs,
  IREmitterStmtResult,
} from '../types';

import { functionRvoStmtTransformer } from './functionRvoStmtTransformer';
import { isIRVariable } from '../../../variables';

import { emitAssignmentIR } from '../emitAssignmentIR';
import { emitDeclarationIR } from '../emitDeclarationIR';
import { emitExpressionStmtIR } from '../emitExpressionStmtIR';
import { emitExpressionIR } from '../emit-expr';
import { emitIfStmtIR } from '../emitIfStmtIR';
import { emitWhileStmtIR, emitDoWhileStmtIR } from '../emit-while-stmt';
import { emitForStmtIR } from '../emitForStmtIR';

type BlockItemIREmitAttrs = IREmitterContextAttrs & {
  node: ASTCCompilerNode;
};

export function emitBlockItemIR({
  context,
  scope,
  node,
}: BlockItemIREmitAttrs): IREmitterStmtResult {
  let result = createBlankStmtResult();

  GroupTreeVisitor.ofIterator<ASTCCompilerNode>({
    [ASTCCompilerKind.ForStmt]: {
      enter: (forStmt: ASTCForStatement) => {
        const nestedContext = {
          ...context,
          allocator: context.allocator.ofNestedScopePrefix(),
        };

        appendStmtResults(
          emitForStmtIR({
            node: forStmt,
            scope: forStmt.scope,
            context: nestedContext,
          }),
          result,
        );

        return false;
      },
    },

    [ASTCCompilerKind.DoWhileStmt]: {
      enter: (whileStmt: ASTCDoWhileStatement) => {
        appendStmtResults(
          emitDoWhileStmtIR({
            node: whileStmt,
            scope,
            context,
          }),
          result,
        );

        return false;
      },
    },

    [ASTCCompilerKind.WhileStmt]: {
      enter: (whileStmt: ASTCDoWhileStatement) => {
        appendStmtResults(
          emitWhileStmtIR({
            node: whileStmt,
            scope,
            context,
          }),
          result,
        );

        return false;
      },
    },

    [ASTCCompilerKind.IfStmt]: {
      enter(ifStmtNode: ASTCIfStatement) {
        appendStmtResults(
          emitIfStmtIR({
            node: ifStmtNode,
            scope,
            context,
          }),
          result,
        );

        return false;
      },
    },

    [ASTCCompilerKind.BlockItemList]: {
      enter(blockItemNode: ASTCBlockItemsList) {
        if (!blockItemNode.scope) {
          return;
        }

        const nestedContext = {
          ...context,
          allocator: context.allocator.ofNestedScopePrefix(),
        };

        blockItemNode.children?.forEach(child => {
          appendStmtResults(
            emitBlockItemIR({
              context: nestedContext,
              scope: blockItemNode.scope,
              node: child,
            }),
            result,
          );
        });

        context.allocator.assignIRAllocatorData(nestedContext.allocator);
        return false;
      },
    },

    [ASTCCompilerKind.ReturnStmt]: {
      enter(expr: ASTCExpression) {
        const fnReturnType = context.parent.fnDecl.type.returnType;
        if (fnReturnType.isVoid()) {
          return false;
        }

        const canBeStoredInReg = fnReturnType.canBeStoredInIntegralReg();
        let assignResult = emitExpressionIR({
          node: expr,
          scope,
          context,
        });

        appendStmtResults(assignResult, result);

        if (canBeStoredInReg) {
          result.instructions.push(new IRRetInstruction(assignResult.output));
        } else {
          if (!isIRVariable(assignResult.output)) {
            throw new IRError(IRErrorCode.RVO_RETURN_CONSTANT);
          }

          result = functionRvoStmtTransformer({
            stmtResult: result,
            returnedVar: assignResult.output,
            rvoOutputVar: context.parent.fnDecl.outputVarPtr,
          });

          result.instructions.push(new IRRetInstruction());
        }

        return false;
      },
    },

    [ASTCCompilerKind.Declaration]: {
      enter(declarationNode: ASTCDeclaration) {
        const declarationResult = emitDeclarationIR({
          node: declarationNode,
          scope,
          context,
        });

        appendStmtResults(declarationResult, result);
        return false;
      },
    },
    [ASTCCompilerKind.AssignmentExpression]: {
      enter(assignmentNode: ASTCAssignmentExpression) {
        if (!assignmentNode.isOperatorExpression()) {
          return;
        }

        const assignResult = emitAssignmentIR({
          node: assignmentNode,
          scope,
          context,
        });

        appendStmtResults(assignResult, result);
        return false;
      },
    },
    [ASTCCompilerKind.ExpressionStmt]: {
      enter(expressionNode: ASTCExpressionStatement) {
        const assignResult = emitExpressionStmtIR({
          node: expressionNode,
          scope,
          context,
        });

        appendStmtResults(assignResult, result);
        return false;
      },
    },
  })(node);

  return result;
}
