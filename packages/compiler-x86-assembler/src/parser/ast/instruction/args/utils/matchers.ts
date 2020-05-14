import {roundedSignedNumberByteSize} from '@compiler/core/utils/numberByteSize';
import {getMSbit} from '@compiler/core/utils/bits';

import {RegisterSchema} from '@compiler/x86-assembler/constants';
import {X86BitsMode, X86AbstractCPU} from '@emulator/x86-cpu/types';

import {InstructionArgType} from '../../../../../types';
import {ASTInstruction} from '../../ASTInstruction';
import {ASTInstructionArg} from '../ASTInstructionArg';
import {ASTInstructionRegisterArg} from '../ASTInstructionRegisterArg';
import {ASTInstructionNumberArg} from '../ASTInstructionNumberArg';
import {ASTInstructionMemPtrArg} from '../ASTInstructionMemPtrArg';

/**
 * CPU:
 * Args matchers used to match args to schema,
 * if there is label in jmp/call instruction - return true,
 * it is used in pessimistic optimistic arg size deduce
 *
 * @see
 *  maxByteSize can be also size of data pointed by address!
 */
export function mem(arg: ASTInstructionArg, maxByteSize: number): boolean {
  return (
    arg.type === InstructionArgType.MEMORY
      && (!maxByteSize || (arg.sizeExplicitOverriden ? arg.byteSize === maxByteSize : arg.byteSize <= maxByteSize))
  );
}

export function moffs(arg: ASTInstructionArg, maxByteSize: X86BitsMode): boolean {
  if (arg.type !== InstructionArgType.MEMORY)
    return false;

  const memArg = <ASTInstructionMemPtrArg> arg;
  return memArg.isDisplacementOnly() && memArg.addressDescription.dispByteSize <= maxByteSize;
}

export function reg(arg: ASTInstructionArg, byteSize: X86BitsMode, segment: boolean = false): boolean {
  if (arg.type !== InstructionArgType.REGISTER)
    return false;

  const _reg = (<ASTInstructionRegisterArg> arg).val;
  return (
    arg.type === InstructionArgType.REGISTER
      && !_reg.x87
      && _reg.byteSize === byteSize
      && _reg.segment === segment
  );
}

export function sreg(arg: ASTInstructionArg, byteSize: X86BitsMode): boolean {
  return reg(arg, byteSize, true);
}

/** Numbers */
export function imm(arg: ASTInstructionArg, maxByteSize: X86BitsMode): boolean {
  return arg.type === InstructionArgType.LABEL || (
    arg.type === InstructionArgType.NUMBER
      && (arg.sizeExplicitOverriden ? arg.byteSize === maxByteSize : arg.byteSize <= maxByteSize)
  );
}

/**
 * Makes a trick in 0x83 instructions that requires signed extended number,
 * they are generally smaller than normal instructions around 1 byte
 * sub di, 0x1 can be encoded using less bytes because it can be expanded
 * implicity and behaves same as sub di, 0x0001
 *
 * @example
 *  add di, 0xFFFE
 *  is transformed to add di, 0xFE with 0x83 signe extend instruction
 *
 * @todo Slow as fuck! Refactor!
 *
 * @export
 * @param {ASTInstructionArg} arg
 * @param {X86BitsMode} maxByteSize
 * @param {X86BitsMode} targetSize
 * @returns {boolean}
 */
export function immCanBeImplicitSignExtendedToByte(
  arg: ASTInstructionArg,
  srcByteSize: X86BitsMode,
  targetSize: X86BitsMode,
): boolean {
  if (arg.type !== InstructionArgType.NUMBER)
    return false;

  const numArg = <ASTInstructionNumberArg> arg;
  const extended = X86AbstractCPU.signExtend(numArg.signedNumber, srcByteSize, targetSize);

  // todo: find better way
  if (Math.sign(numArg.val) === 1) {
    if (extended !== numArg.val)
      return false;
  } else if (X86AbstractCPU.getSignedNumber(extended, targetSize) !== numArg.val)
    return false;

  return getMSbit(extended, targetSize) === getMSbit(numArg.signedNumber, srcByteSize);
}

/** Pointers */
export function relLabel(arg: ASTInstructionArg, signedByteSize: X86BitsMode, absoluteAddress: number): boolean {
  if (arg.type === InstructionArgType.LABEL)
    return true;

  if (arg.type === InstructionArgType.NUMBER) {
    return roundedSignedNumberByteSize(
      (<ASTInstructionNumberArg> arg).val - absoluteAddress - signedByteSize,
    ) === signedByteSize;
  }

  return false;
}

export function nearPointer(arg: ASTInstructionArg, maxByteSize: X86BitsMode, absoluteAddress: number): boolean {
  if (arg.type === InstructionArgType.LABEL)
    return true;

  if (arg.type === InstructionArgType.NUMBER) {
    return roundedSignedNumberByteSize(
      (<ASTInstructionNumberArg> arg).val - absoluteAddress - maxByteSize,
    ) <= maxByteSize;
  }

  return false;
}

export function farSegPointer(arg: ASTInstructionArg, maxByteSize: X86BitsMode): boolean {
  return arg.type === InstructionArgType.SEGMENTED_MEMORY && arg.byteSize <= maxByteSize;
}

export function indirectFarSegPointer(arg: ASTInstructionArg, instruction: ASTInstruction): boolean {
  return arg.type === InstructionArgType.MEMORY && instruction.branchAddressingType !== null;
}

/** FPU */
function x87reg(arg: ASTInstructionArg): RegisterSchema {
  if (arg.type !== InstructionArgType.REGISTER)
    return null;

  const _reg = (<ASTInstructionRegisterArg> arg).val;
  if (!_reg.x87)
    return null;

  return _reg;
}

export function x87sti(arg: ASTInstructionArg, index: number = null): boolean {
  const _reg = x87reg(arg);

  return _reg && (index === null || (_reg.index === index));
}

export function x87st(arg: ASTInstructionArg, instruction: ASTInstruction) {
  const _reg = x87reg(arg);

  return _reg && (instruction.args.length === 1 || _reg.index === 0);
}
