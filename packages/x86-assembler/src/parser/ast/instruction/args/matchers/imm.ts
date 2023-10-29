import { X86BitsMode } from '../../../../../constants';
import { InstructionArgType } from '../../../../../types';
import { ASTInstructionArg } from '../ASTInstructionArg';

/** Numbers */
export function imm(arg: ASTInstructionArg, maxByteSize: X86BitsMode): boolean {
  return (
    arg.type === InstructionArgType.LABEL ||
    (arg.type === InstructionArgType.NUMBER && arg.byteSize <= maxByteSize)
  );
}
