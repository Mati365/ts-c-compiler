import {ASTInstructionArgMatcher} from './ASTInstructionArgMatchers';

export class ASTInstructionMatcherSchema {
  public readonly rm: boolean;

  constructor(
    public readonly name: string,
    public readonly matcher: ASTInstructionArgMatcher,
  ) {
    this.rm = name === 'rmb' || name === 'rmw' || name === 'rmq';
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
}
