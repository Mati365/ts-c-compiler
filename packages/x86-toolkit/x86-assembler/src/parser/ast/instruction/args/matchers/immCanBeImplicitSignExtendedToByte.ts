import { X86BitsMode, X86AbstractCPU } from '@x86-toolkit/cpu/parts';

import { InstructionArgType } from '../../../../../types';
import { ASTInstructionArg } from '../ASTInstructionArg';
import { ASTInstructionNumberArg } from '../ASTInstructionNumberArg';

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
 */
export function immCanBeImplicitSignExtendedToByte(
  arg: ASTInstructionArg,
  srcByteSize: X86BitsMode,
  minTargetByteSize: X86BitsMode,
): boolean {
  if (arg.type !== InstructionArgType.NUMBER) {
    return false;
  }

  const numArg = <ASTInstructionNumberArg>arg;
  const targetSize = <X86BitsMode>(
    Math.max(<X86BitsMode>numArg.byteSize, minTargetByteSize)
  );

  const originalValue = X86AbstractCPU.toUnsignedNumber(numArg.val, targetSize);
  const extended = X86AbstractCPU.signExtend(
    originalValue,
    srcByteSize,
    <X86BitsMode>numArg.signedByteSize,
  );

  return (
    X86AbstractCPU.toUnsignedNumber(extended, targetSize) === originalValue
  );
}
