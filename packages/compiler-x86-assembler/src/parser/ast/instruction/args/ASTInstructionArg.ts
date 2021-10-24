import {InstructionArgType} from '../../../../types';

import {ASTInstructionMatcherSchema} from './ASTInstructionArgMatchers';
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
  // true when user do mov word al, [0x1]
  public sizeExplicitOverriden: boolean = false;

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
