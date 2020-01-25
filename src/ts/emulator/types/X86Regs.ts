import * as R from 'ramda';

import {X86_FLAGS_OFFSETS} from '../constants/x86';

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

  /* Flags */
  flags = 0x0;

  status: {
    cf?: number,
    pf?: number,
    af?: number,
    zf?: number,
    sf?: number,
    tf?: number,
    if?: number,
    df?: number,
    of?: number,
  } = {};

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
          this[reg] = (this[<string> reg] & 0xFF00) | (val & 0xFF);
        },
      });

      Object.defineProperty(this, high, {
        get: () => (this[<string>reg] >> 0x8) & 0xFF,
        set: (val) => {
          this[reg] = (this[<string> reg] & 0xFF) | ((val & 0xFF) << 8);
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
}

export type X86RegName = keyof(X86RegsStore);
