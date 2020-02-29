import {ASTInstructionArgMatcher, isRMSchemaArg} from './args/ASTInstructionArgMatchers';

export class ASTInstructionMatcherSchema {
  public readonly rm: boolean;

  constructor(
    public readonly name: string,
    public readonly matcher: ASTInstructionArgMatcher,
  ) {
    this.rm = isRMSchemaArg(name);
  }
}

export type ASTInstructionArgSchema = {
  name: string,
  matcher: ASTInstructionArgMatcher,
  rm: boolean,
};

export class ASTInstructionSchema {
  constructor(
    public readonly mnemonic: string,
    public readonly argsSchema: ASTInstructionMatcherSchema[],
    public readonly binarySchema: string[],
  ) {}

  get byteSize() { return this.binarySchema.length; }
}
