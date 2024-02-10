import { IRLabelInstruction } from 'frontend/ir/instructions';
import { X86CompilerInstructionFnAttrs } from '../../constants/types';
import { genLabel } from '../../asm-utils';
import { X86CompileInstructionOutput } from './shared';

type LabelInstructionCompilerAttrs = X86CompilerInstructionFnAttrs<IRLabelInstruction>;

export function compileLabelInstruction({ instruction }: LabelInstructionCompilerAttrs) {
  return X86CompileInstructionOutput.ofInstructions([genLabel(instruction.name)]);
}
