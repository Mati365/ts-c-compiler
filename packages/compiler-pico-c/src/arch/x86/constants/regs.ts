import type { X86IntBitsMode, X86RegName } from '@ts-c-compiler/x86-assembler';

import { CCompilerArch } from '#constants';
import { COMPILER_REGISTERS_SET } from '@ts-c-compiler/x86-assembler';
import {
  X87_STACK_REGISTERS,
  type X87StackRegName,
} from '@ts-c-compiler/x86-assembler';

export type X86RegsParts = {
  size: number;
  low: X86RegName;
  high: X86RegName;
};

export type X86IntRegTree = {
  size: X86IntBitsMode;
  name: X86RegName;
  children?: X86IntRegTree[];
  unavailable?: boolean;
};

export type RegsMap = {
  stack: X86RegName;
  addressing: Array<X86RegName>;
  general: {
    size: number;
    list: Array<X86RegName>;
    parts: Record<string, X86RegsParts>;
  };
  int: X86IntRegTree[];
  float: {
    x87: {
      size: number;
      stack: X87StackRegName[];
    };
  };
};

export const createX86RegsMap = (): Record<CCompilerArch, RegsMap> => ({
  [CCompilerArch.X86_16]: {
    stack: 'sp',
    addressing: ['bx', 'si', 'di'],
    general: {
      size: 2,
      list: ['ax', 'cx', 'dx', 'bx'],
      parts: {
        ax: {
          size: 1,
          low: 'al',
          high: 'ah',
        },
        bx: {
          size: 1,
          low: 'bl',
          high: 'bh',
        },
        cx: {
          size: 1,
          low: 'cl',
          high: 'ch',
        },
        dx: {
          size: 1,
          low: 'dl',
          high: 'dh',
        },
      },
    },
    int: [
      {
        name: 'ax',
        size: 0x2,
        children: [
          {
            name: 'al',
            size: 0x1,
          },
          {
            name: 'ah',
            size: 0x1,
          },
        ],
      },
      {
        name: 'bx',
        size: 0x2,
        children: [
          {
            name: 'bl',
            size: 0x1,
          },
          {
            name: 'bh',
            size: 0x1,
          },
        ],
      },
      {
        name: 'cx',
        size: 0x2,
        children: [
          {
            name: 'cl',
            size: 0x1,
          },
          {
            name: 'ch',
            size: 0x1,
          },
        ],
      },
      {
        name: 'dx',
        size: 0x2,
        children: [
          {
            name: 'dl',
            size: 0x1,
          },
          {
            name: 'dh',
            size: 0x1,
          },
        ],
      },
      {
        name: 'di',
        size: 0x2,
      },
      {
        name: 'si',
        size: 0x2,
      },
    ],
    float: {
      x87: {
        size: 0xa,
        stack: [...X87_STACK_REGISTERS],
      },
    },
  },
});

export const getX86RegByteSize = (reg: X86RegName) =>
  COMPILER_REGISTERS_SET[reg].byteSize;
