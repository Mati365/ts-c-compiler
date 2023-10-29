import * as R from 'ramda';

import { BINARY_MASKS } from '@ts-c-compiler/core';
import { roundedSignedNumberByteSize } from '@ts-c-compiler/core';

import { X86BitsMode } from '../../../../../constants';
import { InstructionArgType, BranchAddressingType } from '../../../../../types';

import { ASTInstruction } from '../../ASTInstruction';
import { ASTInstructionArg } from '../ASTInstructionArg';
import { ASTInstructionNumberArg } from '../ASTInstructionNumberArg';

export function nearPointer(
  instruction: ASTInstruction,
  arg: ASTInstructionArg,
  maxByteSize: X86BitsMode,
  absoluteAddress: number,
): boolean {
  if (arg.type === InstructionArgType.LABEL) {
    return true;
  }

  if (arg.type === InstructionArgType.NUMBER) {
    const numArg = <ASTInstructionNumberArg>arg;
    const { byteSize } = numArg;

    if (instruction.branchAddressingType) {
      return instruction.branchAddressingType === BranchAddressingType.NEAR;
    }

    if (R.isNil(numArg.assignedLabel)) {
      return true;
    }

    if (absoluteAddress === null && byteSize <= 0x1) {
      return true;
    }

    const relativeToSegment =
      (numArg.val & BINARY_MASKS[maxByteSize]) - absoluteAddress - maxByteSize;
    return roundedSignedNumberByteSize(relativeToSegment) <= maxByteSize;
  }

  return false;
}
