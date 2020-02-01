import * as R from 'ramda';
import {X86BitsMode, X86RegName} from '../../emulator/types';

export class Register {
  public mnemonic: X86RegName;
  public index: number;
  public byteSize: X86BitsMode;
  public segment: boolean;

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
    mnemonic: X86RegName,
    index: number,
    byteSize: X86BitsMode,
    segment: boolean,
  ) {
    this.mnemonic = mnemonic;
    this.index = index;
    this.byteSize = byteSize;
    this.segment = segment;
  }
}

/**
 * Reduce registers to object with [regName]: Register
 */
export const COMPILER_REGISTERS_SET: {[name: string]: Register} = R.reduce(
  (acc, register) => {
    acc[register.mnemonic] = Object.freeze(register);
    return acc;
  },
  {},
  [
    new Register('al', 0x0, 0x1, false),
    new Register('cl', 0x1, 0x1, false),
    new Register('dl', 0x2, 0x1, false),
    new Register('bl', 0x3, 0x1, false),

    new Register('ah', 0x4, 0x1, false),
    new Register('ch', 0x5, 0x1, false),
    new Register('dh', 0x6, 0x1, false),
    new Register('bh', 0x7, 0x1, false),

    new Register('ax', 0x0, 0x2, false),
    new Register('cx', 0x1, 0x2, false),
    new Register('dx', 0x2, 0x2, false),
    new Register('bx', 0x3, 0x2, false),
    new Register('sp', 0x4, 0x2, false),
    new Register('bp', 0x5, 0x2, false),
    new Register('si', 0x6, 0x2, false),
    new Register('di', 0x7, 0x2, false),

    new Register('es', 0x0, 0x2, true),
    new Register('cs', 0x1, 0x2, true),
    new Register('ss', 0x2, 0x2, true),
    new Register('ds', 0x3, 0x2, true),
    new Register('fs', 0x4, 0x2, true),
    new Register('gs', 0x5, 0x2, true),
  ],
);
