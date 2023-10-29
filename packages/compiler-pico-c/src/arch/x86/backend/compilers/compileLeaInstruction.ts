import { CBackendError, CBackendErrorCode } from 'backend/errors/CBackendError';

import { CPrimitiveType } from 'frontend/analyze';
import { IRLeaInstruction } from 'frontend/ir/instructions';

import { X86CompilerInstructionFnAttrs } from '../../constants/types';
import {
  genInstruction,
  genLabelName,
  withInlineComment,
} from '../../asm-utils';

type LeaInstructionCompilerAttrs =
  X86CompilerInstructionFnAttrs<IRLeaInstruction>;

export function compileLeaInstruction({
  instruction,
  context,
}: LeaInstructionCompilerAttrs): string[] {
  const { inputVar, outputVar } = instruction;
  const {
    allocator: { regs, config, stackFrame },
  } = context;

  const addressReg = regs.requestReg({
    size: CPrimitiveType.address(config.arch).getByteSize(),
    prefer: regs.ownership.getAvailableRegs().addressing,
  });

  regs.ownership.setOwnership(outputVar.name, {
    reg: addressReg.value,
  });

  // variable allocated in data segment
  // such like: const char* str = "Hello world!";
  if (inputVar.constInitialized) {
    return [
      ...addressReg.asm,
      withInlineComment(
        genInstruction('mov', addressReg.value, genLabelName(inputVar.name)),
        instruction.getDisplayName(),
      ),
    ];
  }

  // int* a = &k;
  const stackAddress = stackFrame.getLocalVarStackRelAddress(inputVar.name);
  if (stackAddress) {
    return [
      ...addressReg.asm,
      withInlineComment(
        genInstruction('lea', addressReg.value, stackAddress),
        instruction.getDisplayName(),
      ),
    ];
  }

  throw new CBackendError(CBackendErrorCode.UNABLE_TO_COMPILE_INSTRUCTION);
}
