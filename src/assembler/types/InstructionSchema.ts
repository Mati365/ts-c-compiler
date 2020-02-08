import {ASTInstructionArgMatcher} from '../parser/ast/Instruction/ASTInstructionMatchers';

export class InstructionSchema {
  public mnemonic: string;
  public argsSchema: ASTInstructionArgMatcher[];
  public binarySchema: string;

  constructor(
    mnemonic: string,
    argsSchema: ASTInstructionArgMatcher[],
    binarySchema: string,
  ) {
    this.mnemonic = mnemonic;
    this.binarySchema = binarySchema;
    this.argsSchema = argsSchema;
  }
}
