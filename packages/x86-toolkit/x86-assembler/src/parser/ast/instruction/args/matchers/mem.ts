import { InstructionArgType } from '../../../../../types';
import { ASTInstruction } from '../../ASTInstruction';
import { ASTInstructionArg } from '../ASTInstructionArg';

/**
 * CPU:
 * Args matchers used to match args to schema,
 * if there is label in jmp/call instruction - return true,
 * it is used in pessimistic optimistic arg size deduce
 *
 * @see
 *  maxByteSize can be also size of data pointed by address!
 */
export function mem(
  arg: ASTInstructionArg,
  instruction: ASTInstruction,
  maxByteSize: number,
): boolean {
  return (
    arg.type === InstructionArgType.MEMORY &&
    instruction.branchAddressingType === null &&
    (!maxByteSize ||
      (arg.sizeExplicitOverriden
        ? arg.byteSize === maxByteSize
        : arg.byteSize <= maxByteSize))
  );
}
