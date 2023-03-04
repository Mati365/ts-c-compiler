import { TokenType } from '@compiler/lexer/shared';
import { ASTCBinaryOpNode } from '@compiler/pico-c/frontend/parser';

import {
  IRBrInstruction,
  IRJmpInstruction,
  IRLabelInstruction,
} from '../../../instructions';
import { IRConstant, isIRConstant } from '../../../variables';

import {
  IREmitterContextAttrs,
  IREmitterStmtResult,
  createBlankExprResult,
  appendStmtResults,
} from '../types';

export type BinaryExpressionCondInstructions = {
  ifTrue?: () => IREmitterStmtResult;
  ifFalse?: () => IREmitterStmtResult;
};

export type LogicBinaryExpressionLabels = {
  ifTrueLabel?: IRLabelInstruction;
  ifFalseLabel?: IRLabelInstruction;
};

type LogicBinaryExpressionIREmitAttrs = IREmitterContextAttrs & {
  node: ASTCBinaryOpNode;
  labels?: LogicBinaryExpressionLabels;
};

export function emitLogicBinaryJmpExpressionIR({
  scope,
  context,
  node,
}: LogicBinaryExpressionIREmitAttrs) {
  const { op } = node;
  const { emit, factory, conditionStmt } = context;
  const { labels } = conditionStmt;

  const result = createBlankExprResult();
  const { instructions } = result;

  const localLabels = {
    rightArgLabel: factory.genTmpLabelInstruction(),
  };

  // if false in OR expr - just jump to next operand (arg1 || arg2 -> jmp from arg1 to arg2)
  // if true in AND expr - just jump to next operand (arg1 && arg2) -> jmp from arg1 to arg2)
  const leftArgLabels =
    op === TokenType.OR
      ? {
          ifFalseLabel: localLabels.rightArgLabel,
        }
      : {
          ifTrueLabel: localLabels.rightArgLabel,
        };

  const results = {
    left: emit.expression({
      node: node.left,
      context: {
        ...context,
        conditionStmt: {
          ...conditionStmt,
          labels: {
            ...labels,
            ...leftArgLabels,
          },
        },
      },
      scope,
    }),

    right: emit.expression({
      node: node.right,
      context,
      scope,
    }),
  };

  const emitConstantBranch = (
    variable: IRConstant,
    branchLabels: LogicBinaryExpressionLabels,
  ) => {
    if (variable.constant && branchLabels.ifTrueLabel) {
      instructions.push(new IRJmpInstruction(branchLabels.ifTrueLabel));
    }

    if (!variable.constant && branchLabels.ifFalseLabel) {
      instructions.push(new IRJmpInstruction(branchLabels.ifFalseLabel));
    }
  };

  if (op === TokenType.OR) {
    appendStmtResults(results.left, result);

    if (results.left.output) {
      if (isIRConstant(results.left.output)) {
        emitConstantBranch(results.left.output, {
          ifTrueLabel: labels.ifTrueLabel,
        });
      } else {
        instructions.push(
          new IRBrInstruction(results.left.output, labels.ifTrueLabel),
        );
      }
    }

    instructions.push(localLabels.rightArgLabel);
    appendStmtResults(results.right, result);

    if (results.right.output) {
      if (isIRConstant(results.right.output)) {
        emitConstantBranch(results.right.output, {
          ifTrueLabel: labels.ifTrueLabel,
        });
      } else {
        instructions.push(
          new IRBrInstruction(results.right.output, labels.ifTrueLabel),
        );
      }
    }

    instructions.push(new IRJmpInstruction(labels.ifFalseLabel));
  } else {
    appendStmtResults(results.left, result);

    if (results.left.output) {
      if (isIRConstant(results.left.output)) {
        emitConstantBranch(results.left.output, {
          ifFalseLabel: labels.ifFalseLabel,
        });
      } else {
        instructions.push(
          new IRBrInstruction(results.left.output, null, labels.ifFalseLabel),
        );
      }
    }

    instructions.push(localLabels.rightArgLabel);
    appendStmtResults(results.right, result);

    if (results.right.output) {
      if (isIRConstant(results.right.output)) {
        emitConstantBranch(results.right.output, {
          ifTrueLabel: labels.ifTrueLabel,
        });
      } else {
        instructions.push(
          new IRBrInstruction(results.right.output, labels.ifTrueLabel),
        );
      }
    }

    instructions.push(new IRJmpInstruction(labels.ifFalseLabel));
  }

  return result;
}
