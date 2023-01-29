import { IRLoadInstruction } from '@compiler/pico-c/frontend/ir/instructions';
import {
  CBackendError,
  CBackendErrorCode,
} from '@compiler/pico-c/backend/errors/CBackendError';

import { BINARY_MASKS } from '@compiler/core/constants';
import { X86_ADDRESSING_REGS } from '../../constants/regs';

import { isIRVariable } from '@compiler/pico-c/frontend/ir/variables';
import { isPointerLikeType } from '@compiler/pico-c/frontend/analyze';
import { isStackVarOwnership } from '../reg-allocator/utils';

import { CompilerInstructionFnAttrs } from '../../constants/types';
import { genInstruction, withInlineComment } from '../../asm-utils';

type LoadInstructionCompilerAttrs =
  CompilerInstructionFnAttrs<IRLoadInstruction>;

export function compileLoadInstruction({
  instruction,
  context,
}: LoadInstructionCompilerAttrs): string[] {
  const { inputVar, outputVar } = instruction;
  const {
    archDescriptor,
    allocator: { regs, stackFrame },
  } = context;

  if (!isIRVariable(inputVar)) {
    return;
  }

  const asm: string[] = [];

  if (inputVar.isTemporary()) {
    // handle loading pointer to types, such as %t{0} = load %t{1}: int*
    const input = regs.tryResolveIRArgAsReg({
      arg: inputVar,
      allowedRegs: X86_ADDRESSING_REGS,
    });

    if (!isPointerLikeType(inputVar.type)) {
      throw new CBackendError(CBackendErrorCode.EXPECTED_IR_PTR_BUT_RECEIVE, {
        type: inputVar.type.getDisplayName(),
      });
    }

    const regSize = archDescriptor.regs.integral.maxRegSize;
    const outputRegByteSize = outputVar.type.getByteSize();

    const reg = regs.requestReg({
      size: regSize,
    });

    regs.ownership.setOwnership(outputVar.name, { reg: reg.value });
    asm.push(
      ...input.asm,
      withInlineComment(
        genInstruction('mov', reg.value, `[${input.value}]`),
        instruction.getDisplayName(),
      ),
    );

    // truncate variable size, it happens when `int a = b;` where `b` is char
    if (regSize > outputRegByteSize) {
      asm.push(
        genInstruction(
          'and',
          reg.value,
          `0x${BINARY_MASKS[outputRegByteSize].toString(16)}`,
        ),
      );
    }
  } else {
    if (
      isPointerLikeType(inputVar.type) &&
      isPointerLikeType(inputVar.type.baseType)
    ) {
      // handle loading pointer to types, such as **k
      const reg = regs.requestReg({
        size: inputVar.type.getByteSize(),
        allowedRegs: X86_ADDRESSING_REGS,
      });

      asm.push(
        ...reg.asm,
        withInlineComment(
          genInstruction(
            'mov',
            reg.value,
            stackFrame.getLocalVarStackRelAddress(inputVar.name),
          ),
          instruction.getDisplayName(),
        ),
      );

      regs.ownership.setOwnership(outputVar.name, {
        reg: reg.value,
      });
    } else {
      // handle loading pointer to types, such as *k
      const cachedOwnership = regs.ownership.getVarOwnership(inputVar.name);

      if (!isStackVarOwnership(cachedOwnership)) {
        throw new CBackendError(CBackendErrorCode.UNKNOWN_BACKEND_ERROR);
      }

      regs.ownership.setOwnership(outputVar.name, {
        stackVar: cachedOwnership.stackVar,
      });
    }
  }

  return asm;
}
