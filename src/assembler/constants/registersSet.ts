import * as R from 'ramda';
import {RegisterSchema} from '../types/RegisterSchema';

export enum InstructionPrefixesBitset {
  REP = 1 << 0,
  REPNE = 1 << 1,
  LOCK = 1 << 2,
}

/**
 * Reduce registers to object with [regName]: Register
 */
export const COMPILER_REGISTERS_SET: {[name: string]: RegisterSchema} = R.reduce(
  (acc, register) => {
    acc[register.mnemonic] = Object.freeze(register);
    return acc;
  },
  {},
  [
    new RegisterSchema('al', 0x0, 0x1, false),
    new RegisterSchema('cl', 0x1, 0x1, false),
    new RegisterSchema('dl', 0x2, 0x1, false),
    new RegisterSchema('bl', 0x3, 0x1, false),

    new RegisterSchema('ah', 0x4, 0x1, false),
    new RegisterSchema('ch', 0x5, 0x1, false),
    new RegisterSchema('dh', 0x6, 0x1, false),
    new RegisterSchema('bh', 0x7, 0x1, false),

    new RegisterSchema('ax', 0x0, 0x2, false),
    new RegisterSchema('cx', 0x1, 0x2, false),
    new RegisterSchema('dx', 0x2, 0x2, false),
    new RegisterSchema('bx', 0x3, 0x2, false),
    new RegisterSchema('sp', 0x4, 0x2, false),
    new RegisterSchema('bp', 0x5, 0x2, false),
    new RegisterSchema('si', 0x6, 0x2, false),
    new RegisterSchema('di', 0x7, 0x2, false),

    new RegisterSchema('es', 0x0, 0x2, true),
    new RegisterSchema('cs', 0x1, 0x2, true),
    new RegisterSchema('ss', 0x2, 0x2, true),
    new RegisterSchema('ds', 0x3, 0x2, true),
    new RegisterSchema('fs', 0x4, 0x2, true),
    new RegisterSchema('gs', 0x5, 0x2, true),
  ],
);
