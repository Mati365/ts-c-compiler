import * as R from 'ramda';

import {RegisterSchema} from '../../../../constants';
import {X86TargetCPU} from '../../../../types';
import {ASTInstruction} from '../ASTInstruction';
import {ASTInstructionArg} from './ASTInstructionArg';
import {
  ASTInstructionSchema,
  ASTInstructionMatcherSchema,
} from '../ASTInstructionSchema';

import {
  mem, moffs, reg, sreg, imm, relLabel, x87sti, x87st,
  nearPointer, farSegPointer, indirectFarSegPointer,
  immCanBeImplicitSignExtendedToByte,
} from './utils/matchers';

/**
 * Mnemonic notation:
 * moffs - memory word offset etc
 * rb, rw, rd - register byte, word, double word
 * sr - segment register
 * rmb, rmw - register or memory byte, word
 * ib, iw - immediate byte, word
 * sl, ll - short label, long label
 * mwr, mdr, mqr, mtr - memory word, double word, quad word, ten byte
 *
 * fptr - absolute indirect far pointer word, 0x7C00:0x123
 * ifptr - indirect absolute far pointer
 *
 * Binary notation:
 * mr - addressing mode byte
 * d0 d1 - displacement
 * i0 i1 - immediate word
 * s0 s1 - short value
 * o0, o1 - offset value
 * s0, s1 - segment value
 * r0 - relative short displacement to label 'sl' (-128/+127 bytes)
 * r0 r1 - relative long displacement to label 'll' (-32768/+32767 bytes)
 *
 * st(i) - stack register x87
 *
 * @see {@link http://www.mathemainzel.info/files/x86asmref.html}
 */
export type ASTInstructionArgMatcher = (
  arg: ASTInstructionArg,
  instruction?: ASTInstruction,
  absoluteAddress?: number,
  schema?: ASTInstructionSchema,
) => boolean;

export type ASTInstructionArgMatcherFactory<T = any> = (config?: T) => ASTInstructionArgMatcher;

export type ASTOpcodeMatchers = {
  [key: string]: ASTInstructionSchema[],
};

export const ASTInstructionArgMatchers: Record<string, ASTInstructionArgMatcherFactory> = {
  eq: (str: string) => (arg: ASTInstructionArg<any>) => {
    const {val} = arg;

    if (val instanceof RegisterSchema)
      return val.mnemonic === str;

    return str === val?.toString();
  },

  /** MEM OFFSET */
  moffs: () => (arg: ASTInstructionArg) => moffs(arg, 2),

  /** MEM */
  m: () => (arg: ASTInstructionArg, instruction: ASTInstruction) => mem(arg, instruction, null),
  mb: () => (arg: ASTInstructionArg, instruction: ASTInstruction) => mem(arg, instruction, 1),
  mw: () => (arg: ASTInstructionArg, instruction: ASTInstruction) => mem(arg, instruction, 2),
  md: () => (arg: ASTInstructionArg, instruction: ASTInstruction) => mem(arg, instruction, 4),
  mq: () => (arg: ASTInstructionArg, instruction: ASTInstruction) => mem(arg, instruction, 8),

  /** REAL MEM */
  mwr: () => (arg: ASTInstructionArg, instruction: ASTInstruction) => mem(arg, instruction, 2),
  mdr: () => (arg: ASTInstructionArg, instruction: ASTInstruction) => mem(arg, instruction, 4),
  mqr: () => (arg: ASTInstructionArg, instruction: ASTInstruction) => mem(arg, instruction, 8),
  mtr: () => (arg: ASTInstructionArg, instruction: ASTInstruction) => mem(arg, instruction, 10),

  /** SREG */
  sr: () => (arg: ASTInstructionArg) => sreg(arg, 2),

  /** REG */
  rb: () => (arg: ASTInstructionArg) => reg(arg, 1),
  rw: () => (arg: ASTInstructionArg) => reg(arg, 2),
  rq: () => (arg: ASTInstructionArg) => reg(arg, 4),

  /** REG/MEM */
  rmb: () => (arg: ASTInstructionArg, instruction: ASTInstruction) => reg(arg, 1) || mem(arg, instruction, 1),
  rmw: () => (arg: ASTInstructionArg, instruction: ASTInstruction) => reg(arg, 2) || mem(arg, instruction, 2),
  rmq: () => (arg: ASTInstructionArg, instruction: ASTInstruction) => reg(arg, 4) || mem(arg, instruction, 4),

  /** IMM */
  ib: () => (arg: ASTInstructionArg) => imm(arg, 1),
  iw: () => (arg: ASTInstructionArg) => imm(arg, 2),

  /** Trick for 0x83 instructions, detect if number is sign extended and save bytes */
  sign_extended_ib_to_iw: () => (arg: ASTInstructionArg) => immCanBeImplicitSignExtendedToByte(arg, 1, 2),

  /** LABEL - size of label will be matched in second phrase */
  sl: () => (arg: ASTInstructionArg, instruction: ASTInstruction, addr: number) => (
    relLabel(instruction, arg, 1, addr)
  ),

  ll: () => (arg: ASTInstructionArg, instruction: ASTInstruction, addr: number) => (
    relLabel(instruction, arg, 2, addr)
  ),

  /** NEAR POINTER */
  np: () => (arg: ASTInstructionArg, instruction: ASTInstruction, addr: number) => (
    nearPointer(instruction, arg, 2, addr)
  ),

  /** ABSOLUTE FAR POINTERS */
  fptr: () => (arg: ASTInstructionArg) => farSegPointer(arg, 4),

  /** INDIRECT ABSOLUTE FAR POINTERS */
  ifptr: () => indirectFarSegPointer,

  /** FPU */
  'st(i)': () => (arg: ASTInstructionArg) => x87sti(arg),
  st: () => x87st, // it is optional due st0 is optional in many instructions
};

export const isOptionalArg = (arg: string): boolean => arg === 'st';

export const isRMSchemaArg = R.contains(
  R.__,
  [
    'm', 'mw', 'mb', 'md', 'mq',
    'rmb', 'rmw', 'rmq',
    'ifptr', 'moffs',
    'mwr', 'mdr', 'mqr', 'mtr',
  ],
);

export const isMoffsSchemaArg = R.contains(R.__, ['moffs']);

/**
 * Transforms string of arg schema to array
 *
 * @example
 *  'al rmb' => [_al, _rmb]
 */
export const argMatchersFromStr = R.ifElse(
  R.either(R.isEmpty, R.isNil),
  R.always([]),
  R.compose(
    R.map(
      (str) => {
        const matcher = ASTInstructionArgMatchers[str];

        return new ASTInstructionMatcherSchema(
          str,
          matcher
            ? matcher()
            : ASTInstructionArgMatchers.eq(str),
        );
      },
    ),
    R.split(' '),
  ),
);

/**
 * Looksup in opcodes table nad matches arguments to schemas
 *
 * @export
 * @param {ASTOpcodeMatchers} matchersSet
 * @param {X86TargetCPU} targetCPU
 * @param {ASTInstruction} instruction
 * @param {number} offset
 * @returns {ASTInstructionSchema[]}
 */
export function findMatchingInstructionSchemas(
  matchersSet: ASTOpcodeMatchers,
  targetCPU: X86TargetCPU,
  instruction: ASTInstruction,
  offset: number,
): ASTInstructionSchema[] {
  const {opcode, args} = instruction;
  const opcodeSchemas = matchersSet[opcode];

  if (!opcodeSchemas)
    return [];

  const targetCheck = R.isNil(targetCPU);
  const schemas = R.filter(
    (schema) => {
      const {
        argsSchema: matchers,
        minArgsCount,
      } = schema;

      if (minArgsCount > args.length)
        return false;

      if (targetCheck && schema.targetCPU > targetCPU)
        return false;

      for (let i = args.length - 1; i >= 0; --i) {
        if (R.isNil(args[i]) || !matchers[i] || !matchers[i].matcher(args[i], instruction, offset, schema))
          return false;
      }

      return true;
    },
    opcodeSchemas,
  );

  return R.sort(
    (a, b) => a.byteSize - b.byteSize,
    schemas,
  );
}
