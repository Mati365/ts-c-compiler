import { IRLabelOffsetInstruction } from '@compiler/pico-c/frontend/ir/instructions';
import { CompilerInstructionFnAttrs } from '../../constants/types';

type LabelOffsetInstructionCompilerAttrs =
  CompilerInstructionFnAttrs<IRLabelOffsetInstruction>;

export function compileLabelOffsetInstruction({
  instruction,
  context,
}: LabelOffsetInstructionCompilerAttrs) {
  const { outputVar } = instruction;
  const { allocator, compiled } = context;

  setTimeout(() => {
    console.info({
      compiled,
      outputVar,
      allocator,
    });
  }, 0);
}
