import { IRJmpInstruction } from 'frontend/ir/instructions';

import { X86CompileInstructionOutput } from './shared';
import { X86CompilerInstructionFnAttrs } from '../../constants/types';
import { genInstruction, genLabelName, withInlineComment } from '../../asm-utils';

type JmpInstructionCompilerAttrs = X86CompilerInstructionFnAttrs<IRJmpInstruction>;

export function compileJmpInstruction({
  instruction,
  context: { allocator },
}: JmpInstructionCompilerAttrs) {
  const { x87regs } = allocator;
  const output = new X86CompileInstructionOutput();

  output.appendGroup(x87regs.tracker.vacuumNotUsed());
  output.appendInstructions(
    withInlineComment(
      genInstruction('jmp', genLabelName(instruction.label.name)),
      instruction.getDisplayName(),
    ),
  );

  return output;
}
