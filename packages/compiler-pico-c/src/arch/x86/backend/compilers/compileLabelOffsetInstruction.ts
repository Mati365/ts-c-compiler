import { IRLabelOffsetInstruction } from '@compiler/pico-c/frontend/ir/instructions';
import { CompilerInstructionFnAttrs } from '../../constants/types';

type LabelOffsetInstructionCompilerAttrs =
  CompilerInstructionFnAttrs<IRLabelOffsetInstruction>;

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
