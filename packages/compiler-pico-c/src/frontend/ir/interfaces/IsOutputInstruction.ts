import type {CIRInstruction} from '../instructions/CIRInstruction';
import type {CIRVariable} from '../variables';

export type IsOutputInstruction = CIRInstruction & {
  outputVar?: CIRVariable;
};
