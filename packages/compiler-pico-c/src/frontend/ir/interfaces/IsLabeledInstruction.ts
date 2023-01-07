import type { IRInstruction } from '../instructions/IRInstruction';

export type IsLabeledInstruction = IRInstruction & {
  name: string;
};
