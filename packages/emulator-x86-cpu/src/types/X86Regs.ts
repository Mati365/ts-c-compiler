import * as R from 'ramda';

import {
  X86_REGISTER_NAMES,
  X86_FLAGS_OFFSETS,
} from '../constants/x86';

import {X87RegName} from '../x87/X87Regs';

export type X86BitsMode = 0x1 | 0x2 | 0x4 | 0x8 | 0xA;

export type X86RegsSet = {[index: number]: X86RegName};

export type X86SegmentPrefix = {_sr: X86RegName};

export type X86Prefix = number | X86SegmentPrefix;

export type X86Flags = {
  cf?: number,
  pf?: number,
  af?: number,
  zf?: number,
  sf?: number,
  tf?: number,
  if?: number,
  df?: number,
  of?: number,
};

type RegistersDebugDump = {
  flags: string,
  regs: ({
    register: string,
    value: string,
  })[],
};

class X86ByteRegsStore {
  al?: number; ah?: number;
  bl?: number; bh?: number;
  cl?: number; ch?: number;
  dl?: number; dh?: number;
}

/**
 * Set of flags that modifies flags variable in X86RegsStore
 *
 * @export
 * @class X86StatusRegs
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
    R.forEachObjIndexed(
      (offset, flag) => {
        Object.defineProperty(
          this.status,
          flag,
          {
            get: () => (this.flags >> offset) & 0x1,
            set: (val) => {
              this.flags ^= (-(val ? 1 : 0) ^ this.flags) & (1 << offset);
            },
          },
        );
      },
      X86_FLAGS_OFFSETS,
    );

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
        get: () => this[<string> reg] & 0xFF,
        set: (val) => {
          this[<string> reg] = (this[<string> reg] & 0xFF00) | (val & 0xFF);
        },
      });

      Object.defineProperty(this, high, {
        get: () => (this[<string>reg] >> 0x8) & 0xFF,
        set: (val) => {
          this[<string> reg] = (this[<string> reg] & 0xFF) | ((val & 0xFF) << 8);
        },
      });
    };

    R.forEach(
      R.apply(defineRegisterAccessors),
      [
        ['ax', 'ah', 'al'],
        ['bx', 'bh', 'bl'],
        ['cx', 'ch', 'cl'],
        ['dx', 'dh', 'dl'],
      ],
    );
  }

  /**
   * Returns human formatted dump of all registers
   *
   * @returns {RegistersDebugDump}
   * @memberof X86RegsStore
   */
  debugDump(): RegistersDebugDump {
    const insertDot = (str: string, pos: number) => `${str.slice(0, pos)}.${str.slice(pos)}`;

    /** Registers */
    const table = [];
    for (const key of X86_REGISTER_NAMES) {
      const reg = this[key];

      if (R.isNil(reg) || Number.isNaN(reg))
        continue;

      let val = reg.toString(16).toUpperCase();
      if (val.length < 8)
        val = new Array(8 - val.length + 1).join('0') + val;

      /** add dots to easier reading value */
      table.push(
        {
          register: key,
          value: `${insertDot(val, 4)} (${reg} ${String.fromCharCode(reg & 0xFF)})`,
        },
      );
    }

    /** Flags */
    let flags = '';
    for (const flag in X86_FLAGS_OFFSETS)
      flags += `${flag}: ${this.status[flag]} `;

    return {
      regs: table,
      flags,
    };
  }
}

/**
 * 8/16bit regs only
 */
export type X86RegName = keyof(X86RegsStore);

/**
 * 32bit regs
 */
export type ExtendedX86RegName = (
  X86RegName
  | X87RegName
  | 'eax' | 'ebx' | 'ecx' | 'edx' | 'esi'
  | 'edi' | 'eip' | 'esp' | 'ebp' | 'eflags'
);
