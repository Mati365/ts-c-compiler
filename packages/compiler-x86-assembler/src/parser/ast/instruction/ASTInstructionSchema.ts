import {X86TargetCPU} from '@compiler/x86-assembler/types';
import {
  ASTInstructionArgMatcher,
  isRMSchemaArg,
  isMoffsSchemaArg,
} from './args/ASTInstructionArgMatchers';

export class ASTInstructionMatcherSchema {
  public readonly rm: boolean;
  public readonly moffset: boolean;

  constructor(
    public readonly name: string,
    public readonly matcher: ASTInstructionArgMatcher,
  ) {
    this.rm = isRMSchemaArg(name);
    this.moffset = isMoffsSchemaArg(name);
  }
}

export class ASTInstructionSchema {
  constructor(
    public readonly mnemonic: string,
    public readonly argsSchema: ASTInstructionMatcherSchema[],
    public readonly binarySchema: string[],
    public readonly targetCPU = X86TargetCPU.I_186,
  ) {}

  get byteSize() { return this.binarySchema.length; }
}
