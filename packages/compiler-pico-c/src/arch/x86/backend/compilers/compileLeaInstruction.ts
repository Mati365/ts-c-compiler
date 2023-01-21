import { CPrimitiveType } from '@compiler/pico-c/frontend/analyze';
import { IRLeaInstruction } from '@compiler/pico-c/frontend/ir/instructions';

import {
  genInstruction,
  genLabelName,
  withInlineComment,
} from '../../asm-utils';
import { CompilerFnAttrs } from '../../constants/types';

type LeaInstructionCompilerAttrs = CompilerFnAttrs & {
  instruction: IRLeaInstruction;
};

export function compileLeaInstruction({
  instruction,
  context,
}: LeaInstructionCompilerAttrs): string[] {
  const { inputVar, outputVar } = instruction;
  const {
    allocator: { regs, config },
  } = context;

  // variable allocated in data segment
  // such like: const char* str = "Hello world!";
  if (inputVar.constInitialized) {
    const addressReg = regs.requestReg({
      size: CPrimitiveType.address(config.arch).getByteSize(),
    });

    regs.transferRegOwnership(outputVar.name, addressReg.value);

    return [
      withInlineComment(
        genInstruction('mov', addressReg.value, genLabelName(inputVar.name)),
        instruction.getDisplayName(),
      ),
    ];
  }

  return [];
}
