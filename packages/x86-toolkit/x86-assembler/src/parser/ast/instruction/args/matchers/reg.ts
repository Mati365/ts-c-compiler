import { X86BitsMode } from '@x86-toolkit/cpu/parts';

import { InstructionArgType } from '../../../../../types';
import { ASTInstructionArg } from '../ASTInstructionArg';
import { ASTInstructionRegisterArg } from '../ASTInstructionRegisterArg';

export function reg(
  arg: ASTInstructionArg,
  byteSize: X86BitsMode,
  segment: boolean = false,
): boolean {
  if (arg.type !== InstructionArgType.REGISTER) {
    return false;
  }

  const regArg = (<ASTInstructionRegisterArg>arg).val;
  return (
    arg.type === InstructionArgType.REGISTER &&
    !regArg.x87 &&
    regArg.byteSize === byteSize &&
    regArg.segment === segment
  );
}
