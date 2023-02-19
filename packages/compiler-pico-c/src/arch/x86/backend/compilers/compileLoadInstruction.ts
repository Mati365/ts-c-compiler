import { IRLoadInstruction } from '@compiler/pico-c/frontend/ir/instructions';
import {
  CBackendError,
  CBackendErrorCode,
} from '@compiler/pico-c/backend/errors/CBackendError';

import { isIRVariable } from '@compiler/pico-c/frontend/ir/variables';
import { isPointerLikeType } from '@compiler/pico-c/frontend/analyze';
import { isStackVarOwnership } from '../reg-allocator/utils';

import { X86CompilerInstructionFnAttrs } from '../../constants/types';
import { genInstruction, withInlineComment } from '../../asm-utils';

type LoadInstructionCompilerAttrs =
  X86CompilerInstructionFnAttrs<IRLoadInstruction>;

export function compileLoadInstruction({
  instruction,
  context,
}: LoadInstructionCompilerAttrs): string[] {
  const { inputVar, outputVar } = instruction;
  const {
    allocator: { regs, stackFrame },
  } = context;

  if (!isIRVariable(inputVar)) {
    throw new CBackendError(CBackendErrorCode.UNKNOWN_BACKEND_ERROR);
  }

  const asm: string[] = [];

  if (inputVar.isTemporary()) {
    // handle loading pointer to types, such as %t{0} = load %t{1}: int*
    const input = regs.tryResolveIRArgAsReg({
      arg: inputVar,
      allowedRegs: regs.ownership.getAvailableRegs().addressing,
    });

    if (!isPointerLikeType(inputVar.type)) {
      throw new CBackendError(CBackendErrorCode.EXPECTED_IR_PTR_BUT_RECEIVE, {
        type: inputVar.type.getDisplayName(),
      });
    }

    const outputRegSize = outputVar.type.getByteSize();
    const regSize = Math.min(
      outputRegSize,
      inputVar.type.baseType.getByteSize(),
    );

    const reg = regs.requestReg({
      size: regSize,
    });

    // truncate variable size, it happens when:
    //  char[] letters = "Hello world";
    //  int b = letters[0] + 2;
    // letter[0] must be truncated to 1 byte (compiler used to emit `mov ax, [bx]` like instruction)
    const zeroExtend = regSize - outputRegSize === 1;

    regs.ownership.setOwnership(outputVar.name, { reg: reg.value });
    asm.push(
      ...reg.asm,
      ...input.asm,
      withInlineComment(
        genInstruction(
          zeroExtend ? 'movzx' : 'mov',
          reg.value,
          `[${input.value}]`,
        ),
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
        allowedRegs: regs.ownership.getAvailableRegs().addressing,
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
