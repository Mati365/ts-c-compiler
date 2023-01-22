import {
  CBackendError,
  CBackendErrorCode,
} from '@compiler/pico-c/backend/errors/CBackendError';

import { CPrimitiveType } from '@compiler/pico-c/frontend/analyze';
import { IRLeaInstruction } from '@compiler/pico-c/frontend/ir/instructions';

import { CompilerInstructionFnAttrs } from '../../constants/types';
import {
  genInstruction,
  genLabelName,
  withInlineComment,
} from '../../asm-utils';

type LeaInstructionCompilerAttrs = CompilerInstructionFnAttrs<IRLeaInstruction>;

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
  });

  regs.ownership.transferRegOwnership(outputVar.name, addressReg.value);

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
  if (!inputVar.isTemporary()) {
    return [
      ...addressReg.asm,
      withInlineComment(
        genInstruction(
          'lea',
          addressReg.value,
          stackFrame.getLocalVarStackRelAddress(inputVar.name),
        ),
        instruction.getDisplayName(),
      ),
    ];
  }

  throw new CBackendError(CBackendErrorCode.UNABLE_TO_COMPILE_INSTRUCTION);
}
