import {RegisterSchema} from './RegisterSchema';

export enum InstructionArgType {
  MEMORY,
  REGISTER,
  NUMBER,
}

/**
 * @see {@link https://cs.lmu.edu/~ray/notes/nasmtutorial/}
 */
export type MemAddressDescription = {
  reg?: RegisterSchema,
  scale?: {
    reg: RegisterSchema,
    value: 1|2|4|8,
  },
  number?: number,
};

export type InstructionArgValue = string|number|RegisterSchema|MemAddressDescription;
