import { X86BitsMode } from '../../../../../constants';
import { InstructionArgType } from '../../../../../types';

import { ASTInstructionArg } from '../ASTInstructionArg';
import { ASTInstructionMemPtrArg } from '../ASTInstructionMemPtrArg';

export function moffs(
  arg: ASTInstructionArg,
  maxByteSize: X86BitsMode,
): boolean {
  if (arg.type !== InstructionArgType.MEMORY) {
    return false;
  }

  const memArg = <ASTInstructionMemPtrArg>arg;
  return (
    memArg.isDisplacementOnly() &&
    memArg.addressDescription.dispByteSize <= maxByteSize
  );
}
