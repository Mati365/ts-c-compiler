import { X86BitsMode } from '../../../../../constants';
import { ASTInstructionArg } from '../ASTInstructionArg';
import { reg } from './reg';

export function sreg(arg: ASTInstructionArg, byteSize: X86BitsMode): boolean {
  return reg(arg, byteSize, true);
}
