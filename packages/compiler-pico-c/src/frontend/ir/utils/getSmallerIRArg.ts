import { IRInstructionVarArg } from '../variables';

export const getSmallerIRArg = <T extends IRInstructionVarArg>(a: T, b: T): T =>
  a.type.getByteSize() < b.type.getByteSize() ? a : b;
