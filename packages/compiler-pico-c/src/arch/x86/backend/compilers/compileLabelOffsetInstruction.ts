import { IRLabelOffsetInstruction } from '@compiler/pico-c/frontend/ir/instructions';
import { X86CompilerInstructionFnAttrs } from '../../constants/types';

type LabelOffsetInstructionCompilerAttrs =
  X86CompilerInstructionFnAttrs<IRLabelOffsetInstruction>;

export function compileLabelOffsetInstruction({
  instruction,
  context,
}: LabelOffsetInstructionCompilerAttrs) {
  const { label } = instruction;
  const { fnResolver } = context;

  setTimeout(() => {
    console.info('TODO:', fnResolver.tryResolveFnLabel(label.name));
  }, 0);
}
