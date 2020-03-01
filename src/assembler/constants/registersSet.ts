import * as R from 'ramda';
import {RegisterSchema as Reg} from '../shared/RegisterSchema';

export enum InstructionPrefix {
  LOCK = 0x0,

  // REP
  REP = 0x3,
  REPE = 0x3,
  REPNE = 0x2,

  // SEGMENT OVERRIDE
  SREG_CS = 0x2E,
  SREG_SS = 0x36,
  SREG_DS = 0x3E,
  SREG_ES = 0x26,
  SREG_FS = 0x64,
  SREG_GS = 0x65,

  // OPERAND OVERRIDE
  OPERAND_OVERRIDE = 0x66,
  ADDRESS_OVERRIDE = 0x67,
}

/**
 * Reduce registers to object with [regName]: Register
 */
export const COMPILER_REGISTERS_SET: {[name: string]: Reg} = R.reduce(
  (acc, register) => {
    acc[register.mnemonic] = Object.freeze(register);
    return acc;
  },
  {},
  [
    /* eslint-disable max-len */
    new Reg('al', 0x0, 0x1, false), new Reg('ah', 0x4, 0x1, false), new Reg('ax', 0x0, 0x2, false), // new Reg('eax', 0x0, 0x4, false),
    new Reg('bl', 0x3, 0x1, false), new Reg('bh', 0x7, 0x1, false), new Reg('bx', 0x3, 0x2, false), // new Reg('ebx', 0x3, 0x4, false),
    new Reg('cl', 0x1, 0x1, false), new Reg('ch', 0x5, 0x1, false), new Reg('cx', 0x1, 0x2, false), // new Reg('ecx', 0x1, 0x4, false),
    new Reg('dl', 0x2, 0x1, false), new Reg('dh', 0x6, 0x1, false), new Reg('dx', 0x2, 0x2, false), // new Reg('edx', 0x2, 0x4, false),

    new Reg('sp', 0x4, 0x2, false), // new Reg('esp', 0x4, 0x4, false),
    new Reg('bp', 0x5, 0x2, false), // new Reg('ebp', 0x5, 0x4, false),
    new Reg('si', 0x6, 0x2, false), // new Reg('esi', 0x6, 0x4, false),
    new Reg('di', 0x7, 0x2, false), // new Reg('edi', 0x7, 0x4, false),

    new Reg('es', 0x0, 0x2, true),
    new Reg('cs', 0x1, 0x2, true),
    new Reg('ss', 0x2, 0x2, true),
    new Reg('ds', 0x3, 0x2, true),
    new Reg('fs', 0x4, 0x2, true),
    new Reg('gs', 0x5, 0x2, true),
    /* eslint-enable max-len */
  ],
);

export const MAX_COMPILER_REG_LENGTH = R.reduce(
  (acc, {byteSize}) => Math.max(acc, byteSize),
  0,
  R.values(<any> COMPILER_REGISTERS_SET),
);
