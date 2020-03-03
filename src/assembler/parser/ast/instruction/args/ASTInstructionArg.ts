import {InstructionArgType} from '../../../../types';

import {ASTInstructionMatcherSchema} from '../ASTInstructionSchema';
import {ASTResolvableArg} from '../ASTResolvableArg';

/**
 * Used for parser to check argument size or type
 *
 * @export
 * @class ASTInstructionArg
 * @extends {ASTResolvableArg<V>}
 * @template V
 */
export class ASTInstructionArg<V = any> extends ASTResolvableArg<V> {
  constructor(
    public type: InstructionArgType,
    value: V,
    public byteSize: number = 1, // unsigned
    public schema: ASTInstructionMatcherSchema = null,
    resolved = true,
  ) {
    super(value, resolved);
  }
}
