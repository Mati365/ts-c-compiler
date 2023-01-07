import { TokenType } from '@compiler/lexer/shared';
import { CPrimitiveType } from '@compiler/pico-c/frontend/analyze';
import { ASTCIfStatement } from '@compiler/pico-c/frontend/parser';

import {
  IRBrInstruction,
  IRICmpInstruction,
  IRJmpInstruction,
} from '../../instructions';
import { IRConstant } from '../../variables';
import { LogicBinaryExpressionLabels } from './emit-expr';

import {
  appendStmtResults,
  createBlankStmtResult,
  IREmitterContextAttrs,
  IREmitterStmtResult,
} from './types';

export type IfStmtIRAttrs = IREmitterContextAttrs & {
  node: ASTCIfStatement;
};

export function emitIfStmtIR({
  scope,
  context,
  node,
}: IfStmtIRAttrs): IREmitterStmtResult {
  const { emit, factory, allocator, config } = context;
  const { arch } = config;

  const result = createBlankStmtResult();
  const { instructions } = result;

  const finallyLabel = factory.genTmpLabelInstruction();
  const labels: LogicBinaryExpressionLabels = {
    ifTrueLabel: factory.genTmpLabelInstruction(),
    ifFalseLabel: node.falseExpression
      ? factory.genTmpLabelInstruction()
      : finallyLabel,
  };

  // compile if (a > 1 && b > 2) { ... }
  const logicResult = emit.expression({
    scope,
    node: node.logicalExpression,
    context: {
      ...context,
      conditionStmt: {
        labels,
      },
    },
  });

  const { output } = logicResult;
  appendStmtResults(logicResult, result);

  if (output) {
    // if (a > 2)
    if (output?.type.isFlag()) {
      instructions.push(new IRBrInstruction(output, null, labels.ifFalseLabel));
    } else {
      // if (a)
      const tmpFlagResult = allocator.allocFlagResult();

      instructions.push(
        new IRICmpInstruction(
          TokenType.DIFFERS,
          output,
          IRConstant.ofConstant(CPrimitiveType.int(arch), 0x0),
          tmpFlagResult,
        ),
        new IRBrInstruction(tmpFlagResult, null, labels.ifFalseLabel),
      );
    }
  }

  instructions.push(labels.ifTrueLabel);
  appendStmtResults(
    emit.block({
      node: node.trueExpression,
      scope,
      context,
    }),
    result,
  );

  if (labels.ifFalseLabel) {
    instructions.push(new IRJmpInstruction(finallyLabel), labels.ifFalseLabel);

    appendStmtResults(
      emit.block({
        node: node.falseExpression,
        scope,
        context,
      }),
      result,
    );
  }

  instructions.push(finallyLabel);
  return result;
}
