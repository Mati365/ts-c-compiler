import { TokenType } from '@compiler/lexer/shared';
import { IRMathInstruction } from '@compiler/pico-c/frontend/ir/instructions';

import {
  CBackendError,
  CBackendErrorCode,
} from '@compiler/pico-c/backend/errors/CBackendError';

import { IRArgDynamicResolverType } from '../X86AbstractRegAllocator';
import { CompilerFnAttrs } from '../../constants/types';
import { genInstruction, withInlineComment } from '../../asm-utils';

type MathInstructionCompilerAttrs = CompilerFnAttrs & {
  instruction: IRMathInstruction;
};

export function compileMathInstruction({
  instruction,
  context,
}: MathInstructionCompilerAttrs): string[] {
  const { leftVar, rightVar, outputVar, operator } = instruction;
  const {
    allocator: { regs },
  } = context;

  switch (operator) {
    case TokenType.MUL:
    case TokenType.PLUS:
    case TokenType.MINUS: {
      const leftAllocResult = regs.tryResolveIRArgAsReg({
        arg: leftVar,
      });

      const rightAllocResult = regs.tryResolveIrArg({
        allow: IRArgDynamicResolverType.REG | IRArgDynamicResolverType.MEM,
        arg: rightVar,
      });

      let asm = '';

      if (operator === TokenType.PLUS) {
        asm = genInstruction(
          'add',
          leftAllocResult.value,
          rightAllocResult.value,
        );
      } else if (operator === TokenType.MUL) {
        asm = genInstruction(
          'imul',
          leftAllocResult.value,
          rightAllocResult.value,
        );
      } else {
        asm = genInstruction(
          'sub',
          leftAllocResult.value,
          rightAllocResult.value,
        );
      }

      if (rightAllocResult.type === IRArgDynamicResolverType.REG) {
        regs.dropOwnershipByReg(rightAllocResult.value);
      }

      regs.transferRegOwnership(outputVar.name, leftAllocResult.value);

      return [
        ...leftAllocResult.asm,
        ...rightAllocResult.asm,
        withInlineComment(asm, instruction.getDisplayName()),
      ];
    }

    case TokenType.DIV: {
      const leftAllocResult = regs.tryResolveIRArgAsReg({
        arg: leftVar,
        specificReg: 'ax',
      });

      const rightAllocResult = regs.tryResolveIrArg({
        allow: IRArgDynamicResolverType.REG | IRArgDynamicResolverType.MEM,
        arg: rightVar,
      });

      regs.releaseReg('dx');
      regs.transferRegOwnership(outputVar.name, leftAllocResult.value);

      return [
        ...leftAllocResult.asm,
        ...rightAllocResult.asm,
        withInlineComment(
          genInstruction('idiv', rightAllocResult.value),
          instruction.getDisplayName(),
        ),
      ];
    }
  }

  throw new CBackendError(CBackendErrorCode.UNABLE_TO_COMPILE_INSTRUCTION);
}
