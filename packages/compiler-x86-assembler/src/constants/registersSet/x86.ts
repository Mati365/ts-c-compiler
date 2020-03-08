import * as R from 'ramda';

import {X86BitsMode, ExtendedX86RegName} from '@emulator/x86-cpu/types';
import {InstructionArgSize} from '../../types';

/**
 * X86 register schema info
 *
 * @export
 * @class RegisterSchema
 */
export class RegisterSchema {
  /**
   * Creates an instance of Register.
   *
   * @param {X86RegName} mnemonic
   * @param {number} index
   * @param {X86BitsMode} byteSize
   * @param {boolean} segment
   * @memberof Register
   */
  constructor(
    public readonly mnemonic: ExtendedX86RegName,
    public readonly index: number,
    public readonly byteSize: X86BitsMode,
    public readonly segment: boolean,
  ) {}

  toString() {
    return this.mnemonic;
  }
}

export enum InstructionPrefix {
  LOCK = 0xF0,

  // REP
  REP = 0xF3,
  REPE = 0xF3,
  REPNE = 0xF2,

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

export type RegSchemaStore = {[name: string]: RegisterSchema};

/**
 * Converts array of registers into object with keys of mnemonics
 *
 * @export
 * @param {Reg[]} regs
 * @returns {RegSchemaStore}
 */
export function reduceRegSchemaStore<T>(regs: T[]): {[name: string]: T} {
  return R.reduce(
    (acc, register) => {
      acc[(<any> register).mnemonic] = Object.freeze(register);
      return acc;
    },
    {},
    regs,
  );
}

/**
 * Reduce registers to object with [regName]: Register
 */
const Reg = RegisterSchema;
export const COMPILER_REGISTERS_SET: RegSchemaStore = reduceRegSchemaStore(
  [
    new Reg('al', 0x0, 0x1, false), new Reg('ah', 0x4, 0x1, false), new Reg('ax', 0x0, 0x2, false),
    new Reg('bl', 0x3, 0x1, false), new Reg('bh', 0x7, 0x1, false), new Reg('bx', 0x3, 0x2, false),
    new Reg('cl', 0x1, 0x1, false), new Reg('ch', 0x5, 0x1, false), new Reg('cx', 0x1, 0x2, false),
    new Reg('dl', 0x2, 0x1, false), new Reg('dh', 0x6, 0x1, false), new Reg('dx', 0x2, 0x2, false),

    new Reg('sp', 0x4, 0x2, false),
    new Reg('bp', 0x5, 0x2, false),
    new Reg('si', 0x6, 0x2, false),
    new Reg('di', 0x7, 0x2, false),

    new Reg('es', 0x0, 0x2, true),
    new Reg('cs', 0x1, 0x2, true),
    new Reg('ss', 0x2, 0x2, true),
    new Reg('ds', 0x3, 0x2, true),
    new Reg('fs', 0x4, 0x2, true),
    new Reg('gs', 0x5, 0x2, true),
  ],
);

export const MIN_COMPILER_REG_LENGTH = InstructionArgSize.WORD;

export const MAX_COMPILER_REG_LENGTH = R.reduce(
  (acc, {byteSize}) => Math.max(acc, byteSize),
  0,
  R.values(<any> COMPILER_REGISTERS_SET),
);
