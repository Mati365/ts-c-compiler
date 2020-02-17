import {ASTInstructionArgMatcher} from './ASTInstructionArgMatchers';

export class ASTInstructionSchema {
  constructor(
    public readonly mnemonic: string,
    public readonly argsSchema: ASTInstructionArgMatcher[],
    public readonly binarySchema: string,
  ) {}
}
