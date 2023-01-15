import { IRLabelInstruction } from '@compiler/pico-c/frontend/ir/instructions';
import { genLabel } from '../../asm-utils';
import { CompilerFnAttrs } from '../../constants/types';

type LabelInstructionCompilerAttrs = CompilerFnAttrs & {
  instruction: IRLabelInstruction;
};

export function compileLabelInstruction({
  instruction,
}: LabelInstructionCompilerAttrs): string[] {
  return [genLabel(instruction.name)];
}
