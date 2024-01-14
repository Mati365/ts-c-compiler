import { IRLoadInstruction } from 'frontend/ir/instructions';
import { CBackendError, CBackendErrorCode } from 'backend/errors/CBackendError';

import { isPointerLikeType, isPrimitiveLikeType } from 'frontend/analyze';
import { castToPointerIfArray } from 'frontend/analyze/casts';

import { X86CompileInstructionOutput } from './shared';
import { X86CompilerInstructionFnAttrs } from '../../constants/types';
import { genInstruction, withInlineComment } from '../../asm-utils';
import {
  IRArgDynamicResolverType,
  isStackVarOwnership,
} from '../reg-allocator';

type LoadInstructionCompilerAttrs =
  X86CompilerInstructionFnAttrs<IRLoadInstruction>;

export function compileLoadInstruction({
  instruction,
  context,
}: LoadInstructionCompilerAttrs) {
  const { inputVar, outputVar } = instruction;
  const {
    allocator: { regs, x87regs, memOwnership, stackFrame },
  } = context;

  const output = new X86CompileInstructionOutput();

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

    const outputReg = regs.requestReg({
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

    regs.ownership.setOwnership(outputVar.name, { reg: outputReg.value });
    output.appendInstructions(
      ...output.asm,
      ...input.asm,
      withInlineComment(
        genInstruction(
          zeroExtend ? 'movzx' : 'mov',
          outputReg.value,
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

      output.appendInstructions(
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
    } else if (
      isPointerLikeType(inputVar.type) &&
      isPrimitiveLikeType(inputVar.type.baseType, true) &&
      inputVar.type.baseType.isFloating()
    ) {
      // %t{0}: float4B = load a{0}: float*2B
      const pushResult = x87regs.pushIRArgOnStack({
        arg: inputVar,
        castedType: inputVar.type.baseType,
      });

      output.appendGroup(pushResult.asm);
    } else {
      // handle loading pointer to types, such as *k
      // %t{0} = load a{0}: int* 2B
      const cachedOwnership = memOwnership.getVarOwnership(inputVar.name);

      if (!isStackVarOwnership(cachedOwnership)) {
        throw new CBackendError(CBackendErrorCode.UNKNOWN_BACKEND_ERROR);
      }

      memOwnership.setOwnership(outputVar.name, {
        stackVar: cachedOwnership.stackVar,
      });
    }
  }

  return output;
}
