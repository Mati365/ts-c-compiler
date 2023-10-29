import { TokenType } from '@ts-c-compiler/lexer';

import type { IRMathSingleArgInstruction } from 'frontend/ir/instructions';
import type { X86CompilerInstructionFnAttrs } from '../../../constants/types';

import { genInstruction, withInlineComment } from '../../../asm-utils';
import { CBackendError, CBackendErrorCode } from 'backend/errors/CBackendError';

type MathSingleInstructionCompilerAttrs =
  X86CompilerInstructionFnAttrs<IRMathSingleArgInstruction>;

export function compileMathSingleInstruction({
  instruction,
  context,
}: MathSingleInstructionCompilerAttrs): string[] {
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

  return [
    ...leftAllocResult.asm,
    withInlineComment(instructionAsm, instruction.getDisplayName()),
  ];
}
