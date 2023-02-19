import { IRJmpInstruction } from '@compiler/pico-c/frontend/ir/instructions';

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
}: JmpInstructionCompilerAttrs): string[] {
  return [
    withInlineComment(
      genInstruction('jmp', genLabelName(instruction.label.name)),
      instruction.getDisplayName(),
    ),
  ];
}
