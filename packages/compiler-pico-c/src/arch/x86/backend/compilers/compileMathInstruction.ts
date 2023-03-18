import { TokenType } from '@compiler/lexer/shared';
import { IRMathInstruction } from '@compiler/pico-c/frontend/ir/instructions';

import {
  CBackendError,
  CBackendErrorCode,
} from '@compiler/pico-c/backend/errors/CBackendError';

import { isIRVariable } from '@compiler/pico-c/frontend/ir/variables';
import { getBiggerIRArg } from '@compiler/pico-c/frontend/ir/utils';

import { IRArgDynamicResolverType } from '../reg-allocator';
import { X86CompilerInstructionFnAttrs } from '../../constants/types';
import { genInstruction, withInlineComment } from '../../asm-utils';

type MathInstructionCompilerAttrs =
  X86CompilerInstructionFnAttrs<IRMathInstruction>;

export function compileMathInstruction({
  instruction,
  context,
}: MathInstructionCompilerAttrs): string[] {
  const { leftVar, rightVar, outputVar, operator } = instruction;
  const {
    iterator,
    allocator: { regs },
  } = context;

  // imul instruction likes only 16bit / 32bit args
  // so force make it at least that big
  let biggestArgSize = getBiggerIRArg(leftVar, rightVar).type.getByteSize();

  switch (operator) {
    case TokenType.BIT_SHIFT_RIGHT:
    case TokenType.BIT_SHIFT_LEFT: {
      const leftAllocResult = regs.tryResolveIRArgAsReg({
        size: biggestArgSize,
        arg: leftVar,
      });

      if (outputVar.isTemporary()) {
        regs.ownership.setOwnership(outputVar.name, {
          reg: leftAllocResult.value,
        });
      }

      const rightAllocResult = regs.tryResolveIrArg({
        size: biggestArgSize,
        arg: rightVar,
        allowedRegs: ['cl', 'cx'],
        allow: IRArgDynamicResolverType.REG | IRArgDynamicResolverType.NUMBER,
      });

      const opcode = operator === TokenType.BIT_SHIFT_RIGHT ? 'sar' : 'sal';
      const asm: string[] = [...leftAllocResult.asm, ...rightAllocResult.asm];

      if (rightAllocResult.value === 'cx') {
        asm.push(
          withInlineComment(
            genInstruction(opcode, leftAllocResult.value, 'cl'),
            instruction.getDisplayName(),
          ),
        );
      } else {
        asm.push(
          withInlineComment(
            genInstruction(
              opcode,
              leftAllocResult.value,
              rightAllocResult.value,
            ),
            instruction.getDisplayName(),
          ),
        );
      }

      return asm;
    }

    case TokenType.POW:
    case TokenType.MUL:
    case TokenType.PLUS:
    case TokenType.MINUS: {
      if (operator === TokenType.MUL) {
        biggestArgSize = Math.max(
          biggestArgSize,
          regs.ownership.getAvailableRegs().general.size,
        );
      }

      const leftAllocResult = regs.tryResolveIRArgAsReg({
        size: biggestArgSize,
        arg: leftVar,
      });

      if (outputVar.isTemporary()) {
        regs.ownership.setOwnership(outputVar.name, {
          reg: leftAllocResult.value,
        });
      }

      // alloc right variable and perform operation
      const rightAllocResult = regs.tryResolveIrArg({
        size: biggestArgSize,
        arg: rightVar,
      });

      let operatorAsm: string = null;

      if (operator === TokenType.POW) {
        operatorAsm = genInstruction(
          'xor',
          leftAllocResult.value,
          rightAllocResult.value,
        );
      } else if (operator === TokenType.PLUS) {
        operatorAsm = genInstruction(
          'add',
          leftAllocResult.value,
          rightAllocResult.value,
        );
      } else if (operator === TokenType.MUL) {
        if (
          rightAllocResult.type === IRArgDynamicResolverType.NUMBER &&
          rightAllocResult.value > 0 &&
          rightAllocResult.value % 2 === 0 &&
          Number.isInteger(Math.log2(rightAllocResult.value))
        ) {
          // transform `mul` with arg `2`, `4`, itp. into `shl`
          operatorAsm = genInstruction(
            'shl',
            leftAllocResult.value,
            Math.log2(rightAllocResult.value),
          );
        } else {
          // compile normal `imul`
          operatorAsm = genInstruction(
            'imul',
            leftAllocResult.value,
            rightAllocResult.value,
          );
        }
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
          withInlineComment(
            genInstruction('mov', reg.value, leftAllocResult.value),
            `swap - ${instruction.getDisplayName()}`,
          ),
        );

        regs.ownership.setOwnership(leftVar.name, {
          releasePrevAllocatedReg: false,
          reg: reg.value,
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

      if (outputVar.isTemporary()) {
        regs.ownership.setOwnership(outputVar.name, {
          reg: leftAllocResult.value,
        });
      }

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
