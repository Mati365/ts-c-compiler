import { IRLabelOffsetInstruction } from 'frontend/ir/instructions';
import { X86CompilerInstructionFnAttrs } from '../../constants/types';

type LabelOffsetInstructionCompilerAttrs =
  X86CompilerInstructionFnAttrs<IRLabelOffsetInstruction>;

export function compileLabelOffsetInstruction({
  instruction,
  context,
}: LabelOffsetInstructionCompilerAttrs) {
  const {
    labelsResolver,
    allocator: { memOwnership },
  } = context;

  const { label, outputVar } = instruction;
  const resolvedLabel = labelsResolver.getLabel(label.name);

  memOwnership.setOwnership(outputVar.name, {
    asmLabel: resolvedLabel.asmLabel,
  });
}
