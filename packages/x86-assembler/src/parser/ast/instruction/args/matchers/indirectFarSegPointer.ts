import { InstructionArgType, BranchAddressingType } from '../../../../../types';
import { ASTInstruction } from '../../ASTInstruction';
import { ASTInstructionArg } from '../ASTInstructionArg';

export function indirectFarSegPointer(
  arg: ASTInstructionArg,
  instruction: ASTInstruction,
): boolean {
  const { branchAddressingType } = instruction;

  return (
    arg.type === InstructionArgType.MEMORY &&
    (branchAddressingType === BranchAddressingType.FAR || branchAddressingType === null)
  );
}
