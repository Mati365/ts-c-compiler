import { ASTCCompilerNode } from 'frontend/parser';

import { IREmitterContextAttrs } from '../types';
import { BinaryExpressionCondInstructions } from './emitLogicBinaryJmpExpressionIR';
import { IRConstant } from 'frontend/ir/variables';
import {
  IRBrInstruction,
  IRICmpInstruction,
  IRLabelInstruction,
} from 'frontend/ir/instructions';

import { TokenType } from '@ts-c-compiler/lexer';
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

  if (output && jmpToLabelIf) {
    // if (a > 2)
    if (output?.type.isFlag()) {
      logicResult.instructions.push(
        new IRBrInstruction(output, jmpToLabelIf.nonZero, jmpToLabelIf.zero),
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
        new IRBrInstruction(
          tmpFlagResult,
          jmpToLabelIf.nonZero,
          jmpToLabelIf.zero,
        ),
      );
    }
  }

  return logicResult;
}
