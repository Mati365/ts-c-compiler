import { IRLoadInstruction } from '@compiler/pico-c/frontend/ir/instructions';
import {
  CBackendError,
  CBackendErrorCode,
} from '@compiler/pico-c/backend/errors/CBackendError';

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

    const reg = regs.requestReg({
      size: inputVar.type.getByteSize(),
    });

    regs.ownership.setOwnership(outputVar.name, { reg: reg.value });
    asm.push(
      ...input.asm,
      withInlineComment(
        genInstruction('mov', reg.value, `[${input.value}]`),
        instruction.getDisplayName(),
      ),
    );
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
