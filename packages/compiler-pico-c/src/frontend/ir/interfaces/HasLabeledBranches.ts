import type { IRLabelInstruction } from '../instructions/IRLabelInstruction';

export interface HasLabeledBranches {
  ofLabels(labels: IRLabelInstruction[]): this;
  getLabels(): IRLabelInstruction[];
}

export function isWithLabeledBranches(
  instruction: any,
): instruction is HasLabeledBranches {
  return instruction && 'ofLabels' in instruction;
}
