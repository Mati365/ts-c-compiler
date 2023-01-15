import { IRJmpInstruction } from '@compiler/pico-c/frontend/ir/instructions';
import {
  genInstruction,
  genLabelName,
  withInlineComment,
} from '../../asm-utils';

import { CompilerFnAttrs } from '../../constants/types';

type JmpInstructionCompilerAttrs = CompilerFnAttrs & {
  instruction: IRJmpInstruction;
};

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
