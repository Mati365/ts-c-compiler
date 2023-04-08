import { TokenType } from '@compiler/lexer/shared';
import { IRMathInstruction } from '@compiler/pico-c/frontend/ir/instructions';

import {
  CBackendError,
  CBackendErrorCode,
} from '@compiler/pico-c/backend/errors/CBackendError';

import { getBiggerIRArg } from '@compiler/pico-c/frontend/ir/utils';
import { CMathOperator } from '@compiler/pico-c/constants';

import { IRArgDynamicResolverType } from '../../reg-allocator';
import { X86CompilerInstructionFnAttrs } from '../../../constants/types';
import { genInstruction, withInlineComment } from '../../../asm-utils';
import { ensureFunctionNotOverridesOutput } from './ensureFunctionNotOverrideOutput';
import { castToPointerIfArray } from '@compiler/pico-c/frontend/analyze/casts';
import { isNopMathInstruction } from './isNopMathInstruction';
import { isIRVariable } from '@compiler/pico-c/frontend/ir/variables';

const BinaryOperatorX86Opcode: Partial<Record<CMathOperator, string>> = {
  [TokenType.BIT_OR]: 'xor',
  [TokenType.BIT_AND]: 'and',
  [TokenType.PLUS]: 'add',
  [TokenType.MINUS]: 'sub',
};

type MathInstructionCompilerAttrs =
  X86CompilerInstructionFnAttrs<IRMathInstruction>;

export function compileMathInstruction({
  instruction,
  context,
}: MathInstructionCompilerAttrs): string[] {
  const { leftVar, rightVar, outputVar, operator } = instruction;
  const {
    allocator: { regs },
  } = context;

  // imul instruction likes only 16bit / 32bit args
  // so force make it at least that big
  let biggestArgSize = castToPointerIfArray(
    getBiggerIRArg(leftVar, rightVar).type,
  ).getByteSize();

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

    case TokenType.BIT_OR:
    case TokenType.BIT_AND:
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

      if (isIRVariable(leftVar) && isNopMathInstruction(instruction)) {
        regs.ownership.aliasOwnership(leftVar.name, instruction.outputVar.name);
        return [];
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
      const opcode = BinaryOperatorX86Opcode[operator];

      if (opcode) {
        operatorAsm = genInstruction(
          opcode,
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
        throw new CBackendError(CBackendErrorCode.UNKNOWN_MATH_OPERATOR);
      }

      return [
        ...leftAllocResult.asm,
        ...rightAllocResult.asm,
        ...ensureFunctionNotOverridesOutput({
          leftVar,
          leftAllocResult,
          context,
        }),
        withInlineComment(operatorAsm, instruction.getDisplayName()),
      ];
    }

    case TokenType.MOD:
    case TokenType.DIV: {
      const allocResult = {
        remainder: regs.requestReg({ allowedRegs: ['dx'] }),
        quotient: regs.tryResolveIRArgAsReg({
          allowedRegs: ['ax'],
          arg: leftVar,
        }),
      };

      const rightAllocResult = regs.tryResolveIrArg({
        allow: IRArgDynamicResolverType.REG | IRArgDynamicResolverType.MEM,
        allowedRegs: ['cx', 'bx'],
        arg: rightVar,
        size: 2,
      });

      const asm = [
        ...allocResult.remainder.asm,
        ...allocResult.quotient.asm,
        ...rightAllocResult.asm,
        ...ensureFunctionNotOverridesOutput({
          leftVar,
          leftAllocResult: allocResult.quotient,
          context,
        }),
        genInstruction('xor', 'dx', 'dx'),
        withInlineComment(
          genInstruction('idiv', rightAllocResult.value),
          instruction.getDisplayName(),
        ),
      ];

      if (operator === TokenType.MOD) {
        // we want remainder in variable
        if (outputVar.isTemporary()) {
          regs.ownership.setOwnership(outputVar.name, {
            reg: allocResult.remainder.value,
          });
        } else {
          regs.releaseRegs([allocResult.remainder.value]);
        }

        regs.releaseRegs([allocResult.quotient.value]);
      } else {
        // we want quotient in variable here
        if (outputVar.isTemporary()) {
          regs.ownership.setOwnership(outputVar.name, {
            reg: allocResult.quotient.value,
          });
        } else {
          regs.releaseRegs([allocResult.quotient.value]);
        }

        regs.releaseRegs([allocResult.remainder.value]);
      }

      return asm;
    }
  }

  throw new CBackendError(CBackendErrorCode.UNABLE_TO_COMPILE_INSTRUCTION);
}
