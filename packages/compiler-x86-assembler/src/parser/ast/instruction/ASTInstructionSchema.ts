import * as R from 'ramda';

import {X86TargetCPU} from '@compiler/x86-assembler/types';
import type {ASTInstructionMatcherSchema} from './args';

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
