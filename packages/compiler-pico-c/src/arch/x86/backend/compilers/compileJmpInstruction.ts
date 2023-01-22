import { IRJmpInstruction } from '@compiler/pico-c/frontend/ir/instructions';

import { CompilerInstructionFnAttrs } from '../../constants/types';
import {
  genInstruction,
  genLabelName,
  withInlineComment,
} from '../../asm-utils';

type JmpInstructionCompilerAttrs = CompilerInstructionFnAttrs<IRJmpInstruction>;

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
