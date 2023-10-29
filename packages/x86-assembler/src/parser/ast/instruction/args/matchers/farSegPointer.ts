import { X86BitsMode } from '../../../../../constants';
import { InstructionArgType } from '../../../../../types';
import { ASTInstructionArg } from '../ASTInstructionArg';

export function farSegPointer(
  arg: ASTInstructionArg,
  maxByteSize: X86BitsMode,
): boolean {
  return (
    arg.type === InstructionArgType.SEGMENTED_MEMORY &&
    arg.byteSize <= maxByteSize
  );
}
