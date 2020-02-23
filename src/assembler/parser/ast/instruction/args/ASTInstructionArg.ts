import {
  InstructionArgValue,
  InstructionArgType,
} from '../../../../types';

import {ASTInstructionArgSchema} from '../ASTInstructionSchema';
import {ASTResolvableArg} from '../../ASTResolvableArg';

/**
 * Used for parser to check argument size or type
 *
 * @class ASTInstructionArg
 */
export class ASTInstructionArg extends ASTResolvableArg<InstructionArgValue> {
  constructor(
    public type: InstructionArgType,
    value: InstructionArgValue,
    public byteSize: number = 1, // unsigned
    public schema: ASTInstructionArgSchema = null,
    _resolved = true,
  ) {
    super(value, _resolved);
  }
}
