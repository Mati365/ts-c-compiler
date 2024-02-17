import { ASTCCompilerNode } from 'frontend/parser';

import { IREmitterContextAttrs } from '../types';
import { BinaryExpressionCondInstructions } from './emitLogicBinaryJmpExpressionIR';
import { IRConstant, isIRConstant } from 'frontend/ir/variables';
import {
  IRBrInstruction,
  IRICmpInstruction,
  IRJmpInstruction,
  IRLabelInstruction,
} from 'frontend/ir/instructions';

import { TokenType } from '@ts-cc/lexer';
import { CPrimitiveType } from 'frontend/analyze';

type LogicExpressionIREmitAttrs = IREmitterContextAttrs & {
  node: ASTCCompilerNode;
  instructions?: BinaryExpressionCondInstructions;
  jmpToLabelIf?: {
    zero?: IRLabelInstruction;
    nonZero?: IRLabelInstruction;
  };
};

export function emitLogicExpressionIR({
  scope,
  context,
  node,
  jmpToLabelIf,
}: LogicExpressionIREmitAttrs) {
  const logicResult = context.emit.expression({
    scope,
    context,
    node,
  });

  const { output } = logicResult;

  if (output && (jmpToLabelIf || context.conditionStmt?.labels)) {
    const labels = {
      zero: jmpToLabelIf?.zero ?? context.conditionStmt?.labels.ifFalseLabel,
      nonZero: jmpToLabelIf?.nonZero ?? context.conditionStmt?.labels.ifTrueLabel,
    };

    if (isIRConstant(output)) {
      // if (1)
      if (output.constant && labels.nonZero) {
        logicResult.instructions.push(new IRJmpInstruction(labels.nonZero));
      }

      // if (0)
      if (!output.constant && labels.zero) {
        logicResult.instructions.push(new IRJmpInstruction(labels.zero));
      }
    } else if (output?.type.isFlag()) {
      // if (a > 2)
      logicResult.instructions.push(
        new IRBrInstruction(output, labels.nonZero, labels.zero),
      );
    } else {
      // if (a)
      const tmpFlagResult = context.allocator.allocFlagResult();

      logicResult.instructions.push(
        new IRICmpInstruction(
          TokenType.DIFFERS,
          output,
          IRConstant.ofConstant(CPrimitiveType.int(context.config.arch), 0x0),
          tmpFlagResult,
        ),
        new IRBrInstruction(tmpFlagResult, labels.nonZero, labels.zero),
      );
    }
  }

  return logicResult;
}
