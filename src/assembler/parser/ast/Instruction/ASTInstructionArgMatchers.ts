import * as R from 'ramda';

import {X86BitsMode} from '../../../../emulator/types';
import {InstructionArgType} from '../../../types';
import {RegisterSchema} from '../../../shared/RegisterSchema';
import {ASTInstructionArg} from './ASTInstructionArg';
import {ASTInstructionSchema} from './ASTInstructionSchema';

function mem(arg: ASTInstructionArg, byteSize: X86BitsMode): boolean {
  return arg.type === InstructionArgType.MEMORY && arg.byteSize === byteSize;
}

function reg(arg: ASTInstructionArg, byteSize: X86BitsMode): boolean {
  return arg.type === InstructionArgType.REGISTER && arg.byteSize === byteSize;
}

function imm(arg: ASTInstructionArg, byteSize: X86BitsMode) {
  return arg.type === InstructionArgType.NUMBER && arg.byteSize === byteSize;
}

/**
 * Mnemonic notation:
 * mb,mw,md,mq - memory byte, word, double word, quad word
 * rb, rw, rd - register byte, word, double word
 * rmb, rmw - register or memory byte, word
 * ib, iw - immediate byte, word
 * sl, ll - short label, long label
 * mwr, mdr, mqr, mtr - memory word, double word, quad word, ten byte
 *
 * Binary notation:
 * mr - addressing mode byte
 * d0 d1 - displacement
 * i0 i1 - immediate word
 * s0 s1 - short value
 * r0 - relative short displacement to label 'sl' (-128/+127 bytes)
 * r0 r1 - relative long displacement to label 'll' (-32768/+32767 bytes)
 *
 * @see {@link http://www.mathemainzel.info/files/x86asmref.html}
 */
export type ASTInstructionArgMatcher = (arg: ASTInstructionArg) => boolean;

export type ASTInstructionArgMatcherFactory<T = any> = (config?: T) => ASTInstructionArgMatcher;

export type ASTOpcodeMatchers = {
  [key: string]: ASTInstructionSchema[],
};

export const ASTInstructionArgMatchers: {[key: string]: ASTInstructionArgMatcherFactory} = {
  eq: (str: string) => (arg: ASTInstructionArg) => {
    if (arg.value instanceof RegisterSchema)
      return arg.value.mnemonic === str;

    return false;
  },

  /** MEM */
  mb: () => (arg: ASTInstructionArg) => mem(arg, 1),
  mw: () => (arg: ASTInstructionArg) => mem(arg, 2),
  mq: () => (arg: ASTInstructionArg) => mem(arg, 4),

  /** REG */
  rb: () => (arg: ASTInstructionArg) => reg(arg, 1),
  rw: () => (arg: ASTInstructionArg) => reg(arg, 2),
  rq: () => (arg: ASTInstructionArg) => reg(arg, 4),

  /** REG/MEM */
  rmb: () => (arg: ASTInstructionArg) => reg(arg, 1) || mem(arg, 1),
  rmw: () => (arg: ASTInstructionArg) => reg(arg, 2) || mem(arg, 2),
  rmq: () => (arg: ASTInstructionArg) => reg(arg, 4) || mem(arg, 4),

  /** IMM */
  ib: () => (arg: ASTInstructionArg) => imm(arg, 1),
  iw: () => (arg: ASTInstructionArg) => imm(arg, 2),
};

/**
 * Transforms string of arg schema to array
 *
 * @example
 *  'al rmb' => [_al, _rmb]
 */
export const argMatchersFromStr = R.compose(
  R.map(
    (str) => {
      const matcher = ASTInstructionArgMatchers[str];

      return (
        matcher
          ? matcher()
          : ASTInstructionArgMatchers.eq(str)
      );
    },
  ),
  R.split(' '),
);

/**
 * Looksup in opcodes table nad matches arguments to schema
 *
 * @export
 * @param {ASTOpcodeMatchers} matchersSet
 * @param {string} opcode
 * @param {ASTInstructionArg[]} args
 * @returns {ASTInstructionSchema}
 */
export function findMatchingOpcode(
  matchersSet: ASTOpcodeMatchers,
  opcode: string,
  args: ASTInstructionArg[],
): ASTInstructionSchema {
  const opcodeSchemas = matchersSet[opcode];
  if (!opcodeSchemas)
    return null;

  return R.find(
    (schema) => {
      const {argsSchema: matchers} = schema;

      for (let i = matchers.length - 1; i >= 0; --i) {
        if (R.isNil(args[i]) || !matchers[i](args[i]))
          return false;
      }

      return true;
    },
    opcodeSchemas,
  );
}
