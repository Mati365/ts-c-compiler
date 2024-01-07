import { TokenType } from '@ts-c-compiler/lexer';

import type { IRMathSingleArgInstruction } from 'frontend/ir/instructions';
import type { X86CompilerInstructionFnAttrs } from '../../../../constants/types';

import { genInstruction, withInlineComment } from '../../../../asm-utils';
import { CBackendError, CBackendErrorCode } from 'backend/errors/CBackendError';
import { X86CompileInstructionOutput } from '../../shared';

type MathSingleInstructionCompilerAttrs =
  X86CompilerInstructionFnAttrs<IRMathSingleArgInstruction>;

export function compileIntMathSingleInstruction({
  instruction,
  context,
}: MathSingleInstructionCompilerAttrs) {
  const {
    allocator: { regs },
  } = context;

  const { leftVar, outputVar } = instruction;
  const leftAllocResult = regs.tryResolveIRArgAsReg({
    arg: leftVar,
  });

  if (outputVar.isTemporary()) {
    regs.ownership.setOwnership(outputVar.name, {
      reg: leftAllocResult.value,
    });
  }

  let instructionAsm: string = null;

  switch (instruction.operator) {
    case TokenType.BIT_NOT:
      instructionAsm = genInstruction('xor', leftAllocResult.value, -1);
      break;

    default:
      throw new CBackendError(CBackendErrorCode.UNKNOWN_MATH_OPERATOR);
  }

  return X86CompileInstructionOutput.ofInstructions([
    ...leftAllocResult.asm,
    withInlineComment(instructionAsm, instruction.getDisplayName()),
  ]);
}
