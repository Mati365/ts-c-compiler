import { IRLabelInstruction } from '@compiler/pico-c/frontend/ir/instructions';
import { X86CompilerInstructionFnAttrs } from '../../constants/types';
import { genLabel } from '../../asm-utils';

type LabelInstructionCompilerAttrs =
  X86CompilerInstructionFnAttrs<IRLabelInstruction>;

export function compileLabelInstruction({
  instruction,
}: LabelInstructionCompilerAttrs): string[] {
  return [genLabel(instruction.name)];
}
