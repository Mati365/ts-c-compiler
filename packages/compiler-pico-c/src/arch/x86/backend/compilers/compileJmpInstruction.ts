import { IRJmpInstruction } from 'frontend/ir/instructions';

import { X86CompileInstructionOutput } from './shared';
import { X86CompilerInstructionFnAttrs } from '../../constants/types';
import {
  genInstruction,
  genLabelName,
  withInlineComment,
} from '../../asm-utils';

type JmpInstructionCompilerAttrs =
  X86CompilerInstructionFnAttrs<IRJmpInstruction>;

export function compileJmpInstruction({
  instruction,
}: JmpInstructionCompilerAttrs) {
  return X86CompileInstructionOutput.ofInstructions([
    withInlineComment(
      genInstruction('jmp', genLabelName(instruction.label.name)),
      instruction.getDisplayName(),
    ),
  ]);
}
