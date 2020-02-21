import {
  InstructionArgValue,
  InstructionArgType,
} from '../../../types';

import {ASTInstructionArgSchema} from './ASTInstructionSchema';

/**
 * Used for parser to check argument size or type
 *
 * @class ASTInstructionArg
 */
export class ASTInstructionArg {
  constructor(
    public readonly type: InstructionArgType,
    public value: InstructionArgValue,
    public readonly byteSize: number = 1,
    public schema: ASTInstructionArgSchema = null,
    private _resolved = true,
  ) {}

  toString(): string {
    const {value} = this;

    if (typeof value === 'number')
      return `0x${value.toString(16)}`;

    return value.toString();
  }

  /**
   * Used for second pass compiler, some instruction args
   * can contain labels which are not resolved during compilation
   *
   * @todo
   *  Add compiler params?
   *
   * @returns
   * @memberof ASTInstructionArg
   */
  tryResolve(): boolean {
    this._resolved = true;

    return true;
  }

  /**
   * Returns resolved flag
   *
   * @returns
   * @memberof ASTInstructionArg
   */
  isResolved() {
    return this._resolved;
  }
}
