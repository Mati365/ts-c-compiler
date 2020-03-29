import * as R from 'ramda';

import {X86TargetCPU} from '@compiler/x86-assembler/types';
import {
  ASTInstructionArgMatcher,
  isRMSchemaArg,
  isMoffsSchemaArg,
  isOptionalArg,
} from './args/ASTInstructionArgMatchers';

export class ASTInstructionMatcherSchema {
  public readonly rm: boolean;
  public readonly moffset: boolean;
  public readonly optional: boolean;

  constructor(
    public readonly name: string,
    public readonly matcher: ASTInstructionArgMatcher,
  ) {
    this.rm = isRMSchemaArg(name);
    this.moffset = isMoffsSchemaArg(name);
    this.optional = isOptionalArg(name);
  }
}

export class ASTInstructionSchema {
  public readonly minArgsCount: number;

  constructor(
    public readonly mnemonic: string,
    public readonly argsSchema: ASTInstructionMatcherSchema[],
    public readonly binarySchema: string[],
    public readonly targetCPU = X86TargetCPU.I_186,
  ) {
    this.minArgsCount = R.reject((arg) => arg.optional, argsSchema).length;
  }

  get byteSize() { return this.binarySchema.length; }
}
