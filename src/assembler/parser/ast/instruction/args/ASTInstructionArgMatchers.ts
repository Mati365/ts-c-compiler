import * as R from 'ramda';

import {X86BitsMode} from '../../../../../emulator/types';
import {RegisterSchema} from '../../../../shared/RegisterSchema';

import {InstructionArgType} from '../../../../types';
import {ASTInstruction} from '../ASTInstruction';
import {ASTInstructionArg} from './ASTInstructionArg';
import {ASTInstructionRegisterArg} from './ASTInstructionRegisterArg';
import {ASTInstructionNumberArg} from './ASTInstructionNumberArg';
import {ASTInstructionMemPtrArg} from './ASTInstructionMemPtrArg';
import {
  ASTInstructionSchema,
  ASTInstructionMatcherSchema,
} from '../ASTInstructionSchema';

import {roundedSignedNumberByteSize} from '../../../../utils/numberByteSize';

/**
 * Args matchers used to match args to schema,
 * if there is label in jmp/call instruction - return true,
 * it is used in pessimistic optimistic arg size deduce
 */

function mem(arg: ASTInstructionArg, byteSize: X86BitsMode): boolean {
  return arg.type === InstructionArgType.MEMORY && arg.byteSize === byteSize;
}

function moffs(arg: ASTInstructionArg, maxByteSize: X86BitsMode): boolean {
  if (arg.type !== InstructionArgType.MEMORY)
    return false;

  const memArg = <ASTInstructionMemPtrArg> arg;
  return memArg.isDisplacementOnly() && memArg.addressDescription.dispByteSize <= maxByteSize;
}

function reg(arg: ASTInstructionArg, byteSize: X86BitsMode, segment: boolean = false): boolean {
  return (
    arg.type === InstructionArgType.REGISTER
      && arg.byteSize === byteSize
      && (<ASTInstructionRegisterArg> arg).val.segment === segment
  );
}

function sreg(arg: ASTInstructionArg, byteSize: X86BitsMode): boolean {
  return reg(arg, byteSize, true);
}

function imm(arg: ASTInstructionArg, byteSize: X86BitsMode): boolean {
  return arg.type === InstructionArgType.LABEL || (arg.type === InstructionArgType.NUMBER && arg.byteSize === byteSize);
}

function relLabel(arg: ASTInstructionArg, signedByteSize: X86BitsMode, absoluteAddress: number): boolean {
  if (arg.type === InstructionArgType.LABEL)
    return true;

  if (arg.type === InstructionArgType.NUMBER) {
    return roundedSignedNumberByteSize(
      (<ASTInstructionNumberArg> arg).val - absoluteAddress - signedByteSize,
    ) === signedByteSize;
  }

  return false;
}

function nearPointer(arg: ASTInstructionArg, maxByteSize: X86BitsMode, absoluteAddress: number): boolean {
  if (arg.type === InstructionArgType.LABEL)
    return true;

  if (arg.type === InstructionArgType.NUMBER) {
    return roundedSignedNumberByteSize(
      (<ASTInstructionNumberArg> arg).val - absoluteAddress - maxByteSize,
    ) <= maxByteSize;
  }

  return false;
}

function farSegPointer(arg: ASTInstructionArg, byteSize: X86BitsMode): boolean {
  return arg.type === InstructionArgType.SEGMENTED_MEMORY && arg.byteSize === byteSize;
}

function indirectFarSegPointer(arg: ASTInstructionArg, instruction: ASTInstruction): boolean {
  return arg.type === InstructionArgType.MEMORY && instruction.branchAddressingType !== null;
}

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
 * fptrw - absolute indirect far pointer word, 0x7C00:0x123
 * fptrw - absolute indirect far pointer double word
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

export const ASTInstructionArgMatchers: {[key: string]: ASTInstructionArgMatcherFactory} = {
  eq: (str: string) => (arg: ASTInstructionArg<any>) => {
    const {val} = arg;

    if (val instanceof RegisterSchema)
      return val.mnemonic === str;

    return str === val?.toString();
  },

  /** MEM OFFSET */
  moffs: () => (arg: ASTInstructionArg) => moffs(arg, 2),

  /** SREG */
  sr: () => (arg: ASTInstructionArg) => sreg(arg, 2),

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

  /** LABEL - size of label will be matched in second phrase */
  sl: () => (
    arg: ASTInstructionArg,
    instruction: ASTInstruction,
    addr: number,
  ) => (
    relLabel(arg, 1, addr)
  ),

  ll: () => (
    arg: ASTInstructionArg,
    instruction: ASTInstruction,
    addr: number,
  ) => (
    relLabel(arg, 2, addr)
  ),

  /** NEAR POINTER */
  np: () => (
    arg: ASTInstructionArg,
    instruction: ASTInstruction,
    addr: number,
  ) => (
    nearPointer(arg, 2, addr)
  ),

  /** ABSOLUTE FAR POINTERS */
  fptrw: () => (arg: ASTInstructionArg) => farSegPointer(arg, 2),
  fptrd: () => (arg: ASTInstructionArg) => farSegPointer(arg, 4),

  /** INDIRECT ABSOLUTE FAR POINTERS */
  ifptr: () => indirectFarSegPointer,
};

export const isRMSchemaArg = R.contains(R.__, ['rmb', 'rmw', 'rmq', 'ifptr']);

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
 * @param {ASTInstruction} instruction
 * @param {number} offset
 * @returns {ASTInstructionSchema[]}
 */
export function findMatchingInstructionSchemas(
  matchersSet: ASTOpcodeMatchers,
  instruction: ASTInstruction,
  offset: number,
): ASTInstructionSchema[] {
  const {opcode, args} = instruction;
  const opcodeSchemas = matchersSet[opcode];

  if (!opcodeSchemas)
    return null;

  const schemas = R.filter(
    (schema) => {
      const {argsSchema: matchers} = schema;

      for (let i = matchers.length - 1; i >= 0; --i) {
        if (R.isNil(args[i]) || !matchers[i].matcher(args[i], instruction, offset, schema))
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
