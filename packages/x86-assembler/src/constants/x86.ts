import * as R from 'ramda';

import { InstructionArgSize } from '../types';
import { ExtendedX86RegName, X86BitsMode } from './x86utils';

/**
 * X86 register schema info
 */
export class RegisterSchema {
  /**
   * Creates an instance of RegisterSchema
   */
  constructor(
    readonly mnemonic: ExtendedX86RegName,
    readonly index: number,
    readonly byteSize: X86BitsMode,
    readonly segment: boolean = false,
    readonly x87: boolean = false,
  ) {}

  toString() {
    return this.mnemonic;
  }
}

export type RegSchemaStore = { [name: string]: RegisterSchema };

/**
 * Converts array of registers into object with keys of mnemonics
 */
export function reduceRegSchemaStore<T>(regs: T[]): { [name: string]: T } {
  return R.reduce(
    (acc, register) => {
      acc[(<any>register).mnemonic] = Object.freeze(register);
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

export const COMPILER_REGISTERS_SET: RegSchemaStore = reduceRegSchemaStore([
  // X86
  new Reg('al', 0x0, 0x1),
  new Reg('ah', 0x4, 0x1),
  new Reg('ax', 0x0, 0x2),
  new Reg('bl', 0x3, 0x1),
  new Reg('bh', 0x7, 0x1),
  new Reg('bx', 0x3, 0x2),
  new Reg('cl', 0x1, 0x1),
  new Reg('ch', 0x5, 0x1),
  new Reg('cx', 0x1, 0x2),
  new Reg('dl', 0x2, 0x1),
  new Reg('dh', 0x6, 0x1),
  new Reg('dx', 0x2, 0x2),

  new Reg('sp', 0x4, 0x2),
  new Reg('bp', 0x5, 0x2),
  new Reg('si', 0x6, 0x2),
  new Reg('di', 0x7, 0x2),

  new Reg('es', 0x0, 0x2, true),
  new Reg('cs', 0x1, 0x2, true),
  new Reg('ss', 0x2, 0x2, true),
  new Reg('ds', 0x3, 0x2, true),
  new Reg('fs', 0x4, 0x2, true),
  new Reg('gs', 0x5, 0x2, true),

  // X87
  new Reg('st0', 0x0, 0xa, false, true),
  new Reg('st1', 0x1, 0xa, false, true),
  new Reg('st2', 0x2, 0xa, false, true),
  new Reg('st3', 0x3, 0xa, false, true),
  new Reg('st4', 0x4, 0xa, false, true),
  new Reg('st5', 0x5, 0xa, false, true),
  new Reg('st6', 0x6, 0xa, false, true),
  new Reg('st7', 0x7, 0xa, false, true),
]);

export const MIN_COMPILER_REG_LENGTH = InstructionArgSize.WORD;

export const MAX_COMPILER_REG_LENGTH = R.reduce(
  (acc, { byteSize }) => Math.max(acc, byteSize),
  0,
  R.values(<any>COMPILER_REGISTERS_SET),
);
