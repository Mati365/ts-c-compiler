import {RegisterSchema} from './shared/RegisterSchema';

export enum InstructionArgType {
  MEMORY,
  REGISTER,
  NUMBER,
  LABEL,
  RELATIVE_ADDR,
}

export enum InstructionArgSize {
  BYTE = 0x1,
  WORD = 0x2,
  DWORD = 0x4,
}

export enum BranchAddressingType{
  SHORT = 'short',
  NEAR = 'near',
  FAR = 'far',
}

/**
 * @see {@link https://cs.lmu.edu/~ray/notes/nasmtutorial/}
 */
export type MemSIBScale = 1|2|4|8;

export enum RMAddressingMode {
  INDIRECT_ADDRESSING = 0b00,
  ONE_BYTE_SIGNED_DISP = 0b01,
  FOUR_BYTE_SIGNED_DISP = 0b10,
  REG_ADDRESSING = 0b11,
}

export type MemAddressDescription = {
  sreg?: RegisterSchema,
  reg?: RegisterSchema,
  scale?: {
    reg: RegisterSchema,
    value: MemSIBScale,
  },

  disp?: number,
  dispByteSize?: number,
};

export const isValidScale = (num: number): boolean => num === 1 || num === 2 || num === 4 || num === 8;
