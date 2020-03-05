import {RegisterSchema} from './shared/RegisterSchema';

/**
 * Newer CPU = higher value
 *
 * @export
 * @enum {number}
 */
export enum X86TargetCPU {
  I_186 = 1,
  I_286 = 2,
  I_386 = 3,
  I_486 = 4,
  I_32BIT = 5,
}

export enum InstructionArgType {
  MEMORY,
  SEGMENTED_MEMORY,
  REGISTER,
  NUMBER,
  LABEL,
}

export enum InstructionArgSize {
  BYTE = 0x1,
  WORD = 0x2,
  DWORD = 0x4,
  QWORD = 0x8,
}

export enum BranchAddressingType {
  NEAR = 'near',
  FAR = 'far',
}

export const BRANCH_ADDRESSING_SIZE_MAPPING = {
  [BranchAddressingType.NEAR]: InstructionArgSize.BYTE,
  [BranchAddressingType.FAR]: InstructionArgSize.WORD,
};

/**
 * @see {@link https://cs.lmu.edu/~ray/notes/nasmtutorial/}
 */
export type MemSIBScale = 1|2|4|8;

export type MemAddressDescription = {
  sreg?: RegisterSchema,
  reg?: RegisterSchema,
  scale?: {
    reg: RegisterSchema,
    value: MemSIBScale,
  },

  disp?: number,
  dispByteSize?: number,
  signedByteSize?: number,
};

export const isValidScale = (num: number): boolean => num === 1 || num === 2 || num === 4 || num === 8;
