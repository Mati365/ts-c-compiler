import { TokenType } from '@compiler/lexer/shared';
import { IRMathInstruction } from '@compiler/pico-c/frontend/ir/instructions';

import {
  CBackendError,
  CBackendErrorCode,
} from '@compiler/pico-c/backend/errors/CBackendError';

import { isIRVariable } from '@compiler/pico-c/frontend/ir/variables';
import { isIRVariableLaterUsed } from '../utils';

import { IRArgDynamicResolverType } from '../reg-allocator';
import { CompilerFnAttrs } from '../../constants/types';
import { genInstruction, withInlineComment } from '../../asm-utils';

type MathInstructionCompilerAttrs = CompilerFnAttrs & {
  instruction: IRMathInstruction;
};

export function compileMathInstruction({
  instruction,
  iterator,
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
        arg: rightVar,
      });

      let operatorAsm: string = null;

      if (operator === TokenType.PLUS) {
        operatorAsm = genInstruction(
          'add',
          leftAllocResult.value,
          rightAllocResult.value,
        );
      } else if (operator === TokenType.MUL) {
        operatorAsm = genInstruction(
          'imul',
          leftAllocResult.value,
          rightAllocResult.value,
        );
      } else {
        operatorAsm = genInstruction(
          'sub',
          leftAllocResult.value,
          rightAllocResult.value,
        );
      }

      if (rightAllocResult.type === IRArgDynamicResolverType.REG) {
        regs.ownership.dropOwnershipByReg(rightAllocResult.value);
      }

      const asm: string[] = [...leftAllocResult.asm, ...rightAllocResult.asm];

      // add ax, 1 moves its output to `ax` as a dest
      // but IR code looks like this: %t{1}: int2B = %t{0}: int2B plus %1: int2B
      // it means that if `%t{0}` is being overridden after performing operation
      // in 90% of cases it will not create any problems but there is `++i` and `i++`
      // statements. The second one returns `%t{0}` which is being overridden.
      // so we have to perform lookup ahead if something is using `%t{0}`.
      // if not - do not add any additional instructions
      // if so - generate additional mov
      if (
        isIRVariable(leftVar) &&
        isIRVariableLaterUsed(iterator, leftVar.name)
      ) {
        const reg = regs.requestReg({
          size: leftVar.type.getByteSize(),
        });

        asm.push(
          ...reg.asm,
          genInstruction('mov', reg.value, leftAllocResult.value),
        );

        regs.ownership.transferRegOwnership(leftVar.name, reg.value);
      }

      if (outputVar.isTemporary()) {
        console.info(outputVar.name);
        regs.ownership.transferRegOwnership(
          outputVar.name,
          leftAllocResult.value,
        );
      }

      console.info(regs.ownership.getAllOwnerships());

      asm.push(withInlineComment(operatorAsm, instruction.getDisplayName()));
      return asm;
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

      regs.ownership.dropOwnershipByReg('dx');
      regs.ownership.transferRegOwnership(
        outputVar.name,
        leftAllocResult.value,
      );

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
