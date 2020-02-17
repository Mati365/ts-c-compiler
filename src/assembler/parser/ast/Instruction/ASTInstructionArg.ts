import {
  InstructionArgValue,
  InstructionArgType,
} from '../../../types';

/**
 * Used for parser to check argument size or type
 *
 * @class ASTInstructionArg
 */
export class ASTInstructionArg {
  constructor(
    public readonly type: InstructionArgType,
    public readonly value: InstructionArgValue,
    public readonly byteSize: number = 1,
    private _resolved = true,
  ) {}

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
