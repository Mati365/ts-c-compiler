import {RegisterSchema} from './shared/RegisterSchema';

export enum InstructionArgType {
  MEMORY,
  REGISTER,
  NUMBER,
}

export enum InstructionArgSize {
  BYTE = 1,
  WORD = 2,
}

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
};

export const isValidScale = (num: number): boolean => num === 1 || num === 2 || num === 4 || num === 8;

export type InstructionArgValue = string|number|RegisterSchema|MemAddressDescription;
