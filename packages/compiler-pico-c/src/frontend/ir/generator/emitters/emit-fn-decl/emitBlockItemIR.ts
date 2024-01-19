import { GroupTreeVisitor } from '@ts-c-compiler/grammar';
import {
  ASTCAsmStatement,
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
  ASTCSwitchStatement,
} from 'frontend/parser';

import {
  IRCommentInstruction,
  IRJmpInstruction,
  IRRetInstruction,
} from '../../../instructions';

import {
  appendStmtResults,
  createBlankStmtResult,
  IREmitterContextAttrs,
  IREmitterStmtResult,
} from '../types';

import { emitAssignmentIR } from '../emitAssignmentIR';
import { emitDeclarationIR } from '../emitDeclarationIR';
import { emitExpressionStmtIR } from '../emitExpressionStmtIR';
import { emitExpressionIR } from '../emit-expr';
import { emitIfStmtIR } from '../emitIfStmtIR';
import { emitWhileStmtIR, emitDoWhileStmtIR } from '../emit-while-stmt';
import { emitForStmtIR } from '../emitForStmtIR';
import { emitAsmStatementIR } from '../emitAsmStatementIR';
import { emitSwitchStmtIR } from '../emitSwitchStmtIR';
import { emitCastIR } from '../emitCastIR';

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
    [ASTCCompilerKind.AsmStmt]: {
      enter(asmStmtNode: ASTCAsmStatement) {
        appendStmtResults(
          emitAsmStatementIR({
            node: asmStmtNode,
            scope,
            context,
          }),
          result,
        );

        return false;
      },
    },

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

    [ASTCCompilerKind.SwitchStmt]: {
      enter(switchNode: ASTCSwitchStatement) {
        appendStmtResults(
          emitSwitchStmtIR({
            node: switchNode,
            context,
            scope,
          }),
          result,
        );

        return false;
      },
    },

    [ASTCCompilerKind.ContinueStmt]: {
      enter() {
        const { loopStmt } = context;

        result.instructions.push(
          new IRCommentInstruction('continue'),
          new IRJmpInstruction(loopStmt.startLabel),
        );

        return false;
      },
    },

    [ASTCCompilerKind.BreakStmt]: {
      enter() {
        const { loopStmt } = context;

        result.instructions.push(new IRCommentInstruction('break'));

        if (loopStmt) {
          result.instructions.push(new IRJmpInstruction(loopStmt.finallyLabel));
        }

        return false;
      },
    },

    [ASTCCompilerKind.ReturnStmt]: {
      enter(expr: ASTCExpression) {
        const { fnStmt } = context;
        const fnReturnType = fnStmt.declaration.type.returnType;

        if (fnReturnType.isVoid()) {
          result.instructions.push(new IRRetInstruction());
          return false;
        }

        const assignResult = emitExpressionIR({
          node: expr,
          scope,
          context,
        });

        const castedAssignResult = emitCastIR({
          expectedType: fnReturnType,
          inputVar: assignResult.output,
          context,
        });

        appendStmtResults(assignResult, result);
        appendStmtResults(castedAssignResult, result);

        result.instructions.push(
          new IRRetInstruction(castedAssignResult.output),
        );

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
