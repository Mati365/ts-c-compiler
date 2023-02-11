import { TokenType } from '@compiler/lexer/shared';
import { IRMathInstruction } from '@compiler/pico-c/frontend/ir/instructions';

import {
  CBackendError,
  CBackendErrorCode,
} from '@compiler/pico-c/backend/errors/CBackendError';

import { isIRVariable } from '@compiler/pico-c/frontend/ir/variables';
import { getBiggerIRArg } from '@compiler/pico-c/frontend/ir/utils';

import { IRArgDynamicResolverType } from '../reg-allocator';
import { CompilerInstructionFnAttrs } from '../../constants/types';
import { genInstruction, withInlineComment } from '../../asm-utils';

type MathInstructionCompilerAttrs =
  CompilerInstructionFnAttrs<IRMathInstruction>;

export function compileMathInstruction({
  instruction,
  context,
}: MathInstructionCompilerAttrs): string[] {
  const { leftVar, rightVar, outputVar, operator } = instruction;
  const {
    iterator,
    allocator: { regs },
  } = context;

  switch (operator) {
    case TokenType.MUL:
    case TokenType.PLUS:
    case TokenType.MINUS: {
      const biggerArg = getBiggerIRArg(leftVar, rightVar);
      const leftAllocResult = regs.tryResolveIRArgAsReg({
        size: biggerArg.type.getByteSize(),
        arg: leftVar,
      });

      const rightAllocResult = regs.tryResolveIrArg({
        size: biggerArg.type.getByteSize(),
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
        regs.ownership.lifetime.isVariableLaterUsed(
          iterator.offset,
          leftVar.name,
        )
      ) {
        const reg = regs.requestReg({
          size: leftVar.type.getByteSize(),
        });

        asm.push(
          ...reg.asm,
          genInstruction('mov', reg.value, leftAllocResult.value),
        );

        regs.ownership.setOwnership(leftVar.name, {
          releasePrevAllocatedReg: false,
          reg: reg.value,
        });
      }

      if (outputVar.isTemporary()) {
        regs.ownership.setOwnership(outputVar.name, {
          reg: leftAllocResult.value,
        });
      }

      asm.push(withInlineComment(operatorAsm, instruction.getDisplayName()));
      return asm;
    }

    case TokenType.DIV: {
      const leftAllocResult = regs.tryResolveIRArgAsReg({
        arg: leftVar,
        allowedRegs: ['dx'],
      });

      const rightAllocResult = regs.tryResolveIrArg({
        allow: IRArgDynamicResolverType.REG | IRArgDynamicResolverType.MEM,
        arg: rightVar,
      });

      regs.ownership.setOwnership(outputVar.name, {
        reg: leftAllocResult.value,
      });

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
