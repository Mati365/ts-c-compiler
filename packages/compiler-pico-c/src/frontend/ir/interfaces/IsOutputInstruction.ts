import type {IRInstruction} from '../instructions/IRInstruction';
import type {IRVariable} from '../variables';

export type IsOutputInstruction = IRInstruction & {
  outputVar?: IRVariable;
};
