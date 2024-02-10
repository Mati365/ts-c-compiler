import { IRInstructionTypedArg } from '../variables';

export const getBiggerIRArg = <T extends IRInstructionTypedArg>(a: T, b: T): T =>
  a.type.getByteSize() > b.type.getByteSize() ? a : b;
