import { CCompilerArch } from '@compiler/pico-c/constants';
import { X86IntBitsMode, X86RegName } from '@x86-toolkit/assembler';
import { COMPILER_REGISTERS_SET } from '@x86-toolkit/assembler/constants';
import {
  X87StackRegName,
  X87_STACK_REGISTERS,
} from '@x86-toolkit/cpu/x87/X87Regs';

export type X86IntRegTree = {
  size: X86IntBitsMode;
  name: X86RegName;
  children?: X86IntRegTree[];
  unavailable?: boolean;
};

export type RegsMap = {
  int: X86IntRegTree[];
  float: {
    x87: Readonly<X87StackRegName[]>;
  };
};

export const createX86RegsMap = (): Record<CCompilerArch, RegsMap> => ({
  [CCompilerArch.X86_16]: {
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
      x87: X87_STACK_REGISTERS,
    },
  },
});

export const X86_REGISTERS_SET = COMPILER_REGISTERS_SET;
export const X86_ADDRESSING_REGS: X86RegName[] = ['bx', 'si', 'di'];
export const X86_GENERAL_REGS: X86RegName[] = ['ax', 'cx', 'dx', 'bx'];

export const getX86RegByteSize = (reg: X86RegName) =>
  X86_REGISTERS_SET[reg].byteSize;
