export enum InstructionPrefix {
  LOCK = 0xf0,

  // REP
  REP = 0xf3,
  REPE = 0xf3,
  REPZ = 0xf3,

  REPNE = 0xf2,
  REPNZ = 0xf2,

  // SEGMENT OVERRIDE
  CS = 0x2e,
  SS = 0x36,
  DS = 0x3e,
  ES = 0x26,
  FS = 0x64,
  GS = 0x65,

  // OPERAND OVERRIDE
  OPERAND_OVERRIDE = 0x66,
  ADDRESS_OVERRIDE = 0x67,
}

export type X86IntBitsMode = 0x1 | 0x2 | 0x4 | 0x8;

export type X86BitsMode = X86IntBitsMode | 0xa;

export type X86PrefixName = keyof typeof InstructionPrefix;

/**
 * 8/16bit regs only
 */
export type X86RegName =
  | 'ax'
  | 'al'
  | 'ah'
  | 'bx'
  | 'bl'
  | 'bh'
  | 'cx'
  | 'cl'
  | 'ch'
  | 'dx'
  | 'dl'
  | 'dh'
  | 'si'
  | 'di'
  | 'bp'
  | 'sp'
  | 'ip'
  | 'cs'
  | 'ds'
  | 'es'
  | 'ss'
  | 'fs'
  | 'gs'
  | 'flags';

export type X86SegmentRegName = 'ds' | 'fs' | 'es' | 'cs' | 'ss' | 'gs';

export const X87_STACK_REGISTERS = <const>[
  'st0',
  'st1',
  'st2',
  'st3',
  'st4',
  'st5',
  'st6',
  'st7',
];

export const X87_STACK_REGS_COUNT = X87_STACK_REGISTERS.length;

export type X87StackRegName = (typeof X87_STACK_REGISTERS)[number];

export const isX87RegName = (reg: string): reg is X87StackRegName =>
  X87_STACK_REGISTERS.includes(reg as any);

export const getX87StackRegIndex = (name: X87StackRegName) => +name.replace('st', '');

export const createX87StackRegByIndex = (index: number) =>
  `st${index}` as X87StackRegName;

/**
 * 32bit regs
 */
export type ExtendedX86RegName =
  | X86RegName
  | X87StackRegName
  | 'eax'
  | 'ebx'
  | 'ecx'
  | 'edx'
  | 'esi'
  | 'edi'
  | 'eip'
  | 'esp'
  | 'ebp'
  | 'eflags';
