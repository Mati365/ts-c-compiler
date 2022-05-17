import type {CIRInstruction} from '../instructions/CIRInstruction';

export type IsLabeledInstruction = CIRInstruction & {
  name: string;
};
