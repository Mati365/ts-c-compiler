import * as R from 'ramda';

import { X86_REGISTER_NAMES, X86_FLAGS_OFFSETS } from '../constants/x86';
import { X86RegName } from '@ts-c-compiler/x86-assembler';

export type X86RegsSet = { [index: number]: X86RegName };

export type X86SegmentPrefix = { _sr: X86RegName };

export type X86Prefix = number | X86SegmentPrefix;

export type X86Flags = {
  cf?: number;
  pf?: number;
  af?: number;
  zf?: number;
  sf?: number;
  tf?: number;
  if?: number;
  df?: number;
  of?: number;
};

export type NumericRegisterDumpRow = {
  register: string;
  value: string;
};

export type RegistersDebugDump = {
  flags?: string;
  regs: NumericRegisterDumpRow[];
};

class X86ByteRegsStore {
  al?: number;
  ah?: number;
  bl?: number;
  bh?: number;
  cl?: number;
  ch?: number;
  dl?: number;
  dh?: number;
}

/**
 * Set of flags that modifies flags variable in X86RegsStore
 */
export class X86RegsStore extends X86ByteRegsStore {
  /* Main registers */
  ax = 0x0;
  bx = 0x0;
  cx = 0x0;
  dx = 0x0;

  /* Index registers */
  si = 0x0;
  di = 0x0;
  bp = 0x0;
  sp = 0x0;

  /* Instruction counter */
  ip = 0x0;

  /* Segment registers */
  cs = 0x0;
  ds = 0x0;
  es = 0x0;
  ss = 0x0;
  fs = 0x0;
  gs = 0x0;

  /* Flags */
  flags = 0x0;

  status: X86Flags = {};

  constructor() {
    super();

    /** Define flags register helpers */
    R.forEachObjIndexed((offset, flag) => {
      Object.defineProperty(this.status, flag, {
        get: () => (this.flags >> offset) & 0x1,
        set: val => {
          this.flags ^= (-(val ? 1 : 0) ^ this.flags) & (1 << offset);
        },
      });
    }, X86_FLAGS_OFFSETS);

    /**
     * Separate registers, emulate C++ unions
     * numbers representation
     * Bits:
     * high     low
     * 00000000 00000000
     * todo: Optimize set() methods
     */
    const defineRegisterAccessors = (
      reg: X86RegName,
      high: X86RegName,
      low: X86RegName,
    ) => {
      Object.defineProperty(this, low, {
        get: () => this[<string>reg] & 0xff,
        set: val => {
          this[<string>reg] = (this[<string>reg] & 0xff00) | (val & 0xff);
        },
      });

      Object.defineProperty(this, high, {
        get: () => (this[<string>reg] >> 0x8) & 0xff,
        set: val => {
          this[<string>reg] = (this[<string>reg] & 0xff) | ((val & 0xff) << 8);
        },
      });
    };

    R.forEach(R.apply(defineRegisterAccessors), [
      ['ax', 'ah', 'al'],
      ['bx', 'bh', 'bl'],
      ['cx', 'ch', 'cl'],
      ['dx', 'dh', 'dl'],
    ]);
  }

  /**
   * Transforms object of regs with number values to number table
   */
  static toRegistersTable(
    regs: Record<string, string | number>,
  ): NumericRegisterDumpRow[] {
    const insertDot = (str: string, pos: number) =>
      `${str.slice(0, pos)}.${str.slice(pos)}`;

    /** Registers */
    const table: NumericRegisterDumpRow[] = [];
    for (const key in regs) {
      const reg = regs[key];

      if (R.isNil(reg)) {
        continue;
      }

      let value: string = <string>reg;
      if (R.is(Number, value)) {
        value = reg.toString(16).toUpperCase();
        if (value.length < 8) {
          value = new Array(8 - value.length + 1).join('0') + value;
        }

        // add dots to easier reading value
        value = insertDot(value, 4);
      }

      // add char character
      if (Number.isInteger(<number>reg)) {
        value += ` (${reg} ${String.fromCharCode((<number>reg) & 0xff)})`;
      }

      table.push({
        register: key,
        value,
      });
    }

    return table;
  }

  /**
   * Returns human formatted dump of all registers
   */
  debugDump(): RegistersDebugDump {
    /** Flags */
    let flags = '';
    for (const flag in X86_FLAGS_OFFSETS) {
      flags += `${flag}: ${this.status[flag]} `;
    }

    return {
      regs: X86RegsStore.toRegistersTable(
        R.pick(X86_REGISTER_NAMES, this) as any,
      ),
      flags,
    };
  }
}
