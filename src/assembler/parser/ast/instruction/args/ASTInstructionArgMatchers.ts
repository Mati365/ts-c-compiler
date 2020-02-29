import * as R from 'ramda';

import {X86BitsMode} from '../../../../../emulator/types';
import {RegisterSchema} from '../../../../shared/RegisterSchema';

import {InstructionArgType} from '../../../../types';
import {ASTInstruction} from '../ASTInstruction';
import {ASTInstructionArg} from './ASTInstructionArg';
import {ASTInstructionNumberArg} from './ASTInstructionNumberArg';
import {ASTInstructionMemPtrArg} from './ASTInstructionMemPtrArg';
import {
  ASTInstructionSchema,
  ASTInstructionMatcherSchema,
} from '../ASTInstructionSchema';

function mem(
  arg: ASTInstructionArg,
  byteSize: X86BitsMode,
  displacementOnly: boolean = false,
): boolean {
  if (arg.type !== InstructionArgType.MEMORY || arg.byteSize !== byteSize)
    return false;

  const memArg = <ASTInstructionMemPtrArg> arg;
  return !displacementOnly || memArg.isDisplacementOnly();
}

function reg(arg: ASTInstructionArg, byteSize: X86BitsMode): boolean {
  return arg.type === InstructionArgType.REGISTER && arg.byteSize === byteSize;
}

function imm(arg: ASTInstructionArg, byteSize: X86BitsMode): boolean {
  return arg.type === InstructionArgType.NUMBER && arg.byteSize === byteSize;
}

function relLabel(arg: ASTInstructionArg, signedByteSize: X86BitsMode): boolean {
  if (arg.type === InstructionArgType.LABEL)
    return true;

  if (arg.type === InstructionArgType.RELATIVE_ADDR)
    return (<ASTInstructionNumberArg> arg).signedByteSize === signedByteSize;

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
 * mb,mw,md,mq - memory byte, word, double word, quad word
 * rb, rw, rd - register byte, word, double word
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
export type ASTInstructionArgMatcher = (arg: ASTInstructionArg, instruction?: ASTInstruction) => boolean;

export type ASTInstructionArgMatcherFactory<T = any> = (config?: T) => ASTInstructionArgMatcher;

export type ASTOpcodeMatchers = {
  [key: string]: ASTInstructionSchema[],
};

export const ASTInstructionArgMatchers: {[key: string]: ASTInstructionArgMatcherFactory} = {
  eq: (str: string) => (arg: ASTInstructionArg<any>) => {
    if (arg.value instanceof RegisterSchema)
      return arg.value.mnemonic === str;

    return str === arg.value?.toString();
  },

  /** MEM */
  mb: () => (arg: ASTInstructionArg) => mem(arg, 1, true),
  mw: () => (arg: ASTInstructionArg) => mem(arg, 2, true),
  mq: () => (arg: ASTInstructionArg) => mem(arg, 4, true),

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
  sl: () => (arg: ASTInstructionArg) => relLabel(arg, 1),
  ll: () => (arg: ASTInstructionArg) => relLabel(arg, 2),

  /** ABSOLUTE FAR POINTERS */
  fptrw: () => (arg: ASTInstructionArg) => farSegPointer(arg, 2),
  fptrd: () => (arg: ASTInstructionArg) => farSegPointer(arg, 4),

  /** INDIRECT ABSOLUTE FAR POINTERS */
  ifptr: () => indirectFarSegPointer,
};

export const isRMSchemaArg = R.contains(R.__, ['rmb', 'rmw', 'rmq', 'ifptr']);

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
 * @returns {ASTInstructionSchema[]}
 */
export function findMatchingInstructionSchemas(
  matchersSet: ASTOpcodeMatchers,
  instruction: ASTInstruction,
): ASTInstructionSchema[] {
  const {opcode, args} = instruction;
  const opcodeSchemas = matchersSet[opcode];

  if (!opcodeSchemas)
    return null;

  return R.filter(
    (schema) => {
      const {argsSchema: matchers} = schema;

      for (let i = matchers.length - 1; i >= 0; --i) {
        if (R.isNil(args[i]) || !matchers[i].matcher(args[i], instruction))
          return false;
      }

      return true;
    },
    opcodeSchemas,
  );
}
