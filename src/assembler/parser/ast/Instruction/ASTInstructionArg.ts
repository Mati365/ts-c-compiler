import {
  InstructionArgValue,
  InstructionArgType,
} from '../../../types/InstructionArg';

/**
 * Used for parser to check argument size or type
 *
 * @class ASTInstructionArg
 */
export class ASTInstructionArg {
  public type: InstructionArgType;
  public value: InstructionArgValue;
  public byteSize: number;
  public resolved: boolean;

  constructor(
    type: InstructionArgType,
    value: InstructionArgValue,
    byteSize: number = 1,
    resolved = true,
  ) {
    this.type = type;
    this.value = value;
    this.byteSize = byteSize;
    this.resolved = resolved;
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
    this.resolved = true;

    return true;
  }

  isResolved() {
    return this.resolved;
  }
}
