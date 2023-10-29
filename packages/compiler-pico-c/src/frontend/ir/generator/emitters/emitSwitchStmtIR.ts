import { GroupTreeVisitor } from '@ts-c/grammar';
import { TokenType } from '@ts-c/lexer';
import {
  ASTCCompilerKind,
  type ASTCDefaultCaseStatement,
  type ASTCCaseStatement,
  type ASTCCompilerNode,
  type ASTCSwitchStatement,
} from 'frontend/parser';

import {
  IRBrInstruction,
  IRCommentInstruction,
  IRICmpInstruction,
  IRJmpInstruction,
} from '../../instructions';
import {
  appendStmtResults,
  createBlankStmtResult,
  type IREmitterContextAttrs,
  type IREmitterStmtResult,
} from './types';

export type SwitchStmtIRAttrs = IREmitterContextAttrs & {
  node: ASTCSwitchStatement;
};

export function emitSwitchStmtIR({
  scope,
  context,
  node,
}: SwitchStmtIRAttrs): IREmitterStmtResult {
  const { emit, factory, allocator } = context;
  let caseNumber = 0;

  const result = createBlankStmtResult();
  const { instructions } = result;

  const labels = {
    finally: factory.genTmpLabelInstruction(),
    default: factory.genTmpLabelInstruction(),
  };

  const valueExprResult = emit.expression({
    node: node.expression,
    scope,
    context,
  });

  // switch (<valueExprResult>)
  appendStmtResults(valueExprResult, result);

  // case <caseExprResult>:
  GroupTreeVisitor.ofIterator<ASTCCompilerNode>({
    [ASTCCompilerKind.CaseStmt]: {
      enter(caseItem: ASTCCaseStatement) {
        const caseExprResult = emit.expression({
          node: caseItem.expression,
          scope,
          context,
        });

        const blockStmtResult = emit.block({
          node: caseItem.statement,
          scope,
          context,
        });

        const outputFlagVar = allocator.allocFlagResult();
        const ifFalseLabel = factory.genTmpLabelInstruction();

        instructions.push(
          new IRCommentInstruction(`Case #${++caseNumber}`),
          new IRICmpInstruction(
            TokenType.EQUAL,
            valueExprResult.output,
            caseExprResult.output,
            outputFlagVar,
          ),
          new IRBrInstruction(outputFlagVar, null, ifFalseLabel),
        );

        appendStmtResults(caseExprResult, result);
        appendStmtResults(blockStmtResult, result);

        instructions.push(new IRJmpInstruction(labels.finally), ifFalseLabel);

        return false;
      },
    },

    [ASTCCompilerKind.DefaultCaseStmt]: {
      enter(caseItem: ASTCDefaultCaseStatement) {
        const blockStmtResult = emit.block({
          node: caseItem.statement,
          scope,
          context,
        });

        appendStmtResults(blockStmtResult, result);
      },
    },
  })(node);

  instructions.push(labels.finally);
  return result;
}
