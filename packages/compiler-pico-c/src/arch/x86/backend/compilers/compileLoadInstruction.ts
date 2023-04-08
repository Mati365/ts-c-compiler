import { IRLoadInstruction } from '@compiler/pico-c/frontend/ir/instructions';
import {
  CBackendError,
  CBackendErrorCode,
} from '@compiler/pico-c/backend/errors/CBackendError';

import { isPointerLikeType } from '@compiler/pico-c/frontend/analyze';
import { castToPointerIfArray } from '@compiler/pico-c/frontend/analyze/casts';
import { isStackVarOwnership } from '../reg-allocator/utils';

import { X86CompilerInstructionFnAttrs } from '../../constants/types';
import { genInstruction, withInlineComment } from '../../asm-utils';
import { IRArgDynamicResolverType } from '../reg-allocator';

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

  const asm: string[] = [];

  if (inputVar.isTemporary()) {
    if (!isPointerLikeType(inputVar.type)) {
      throw new CBackendError(CBackendErrorCode.EXPECTED_IR_PTR_BUT_RECEIVE, {
        type: inputVar.type.getDisplayName(),
      });
    }

    const outputRegSize = castToPointerIfArray(outputVar.type).getByteSize();
    const regSize = Math.min(
      outputRegSize,
      inputVar.type.baseType.getByteSize(),
    );

    const output = regs.requestReg({
      size: regSize,
    });

    // handle loading pointer to types, such as %t{0} = load %t{1}: int*
    const input = regs.tryResolveIrArg({
      arg: inputVar,
      allowedRegs: regs.ownership.getAvailableRegs().addressing,
      forceLabelMemPtr: true,
      withoutMemPtrSize: true,
    });

    // truncate variable size, it happens when:
    //  char[] letters = "Hello world";
    //  int b = letters[0] + 2;
    // letter[0] must be truncated to 1 byte (compiler used to emit `mov ax, [bx]` like instruction)
    const zeroExtend = regSize - outputRegSize === 1;

    regs.ownership.setOwnership(outputVar.name, { reg: output.value });
    asm.push(
      ...output.asm,
      ...input.asm,
      withInlineComment(
        genInstruction(
          zeroExtend ? 'movzx' : 'mov',
          output.value,
          input.type === IRArgDynamicResolverType.REG
            ? `[${input.value}]`
            : input.value,
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
