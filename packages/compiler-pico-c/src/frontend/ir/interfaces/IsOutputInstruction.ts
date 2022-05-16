import type {CIRInstruction} from '../instructions/CIRInstruction';

export type IsOutputInstruction = CIRInstruction & {
  outputVar?: string;
};
