import * as R from 'ramda';

import {X86TargetCPU} from 'x86-toolkit/x86-assembler/src/types';
import type {ASTInstructionMatcherSchema} from './args';

export class ASTInstructionSchema {
  readonly minArgsCount: number;

  constructor(
    readonly mnemonic: string,
    readonly argsSchema: ASTInstructionMatcherSchema[],
    readonly binarySchema: string[],
    readonly targetCPU = X86TargetCPU.I_186,
  ) {
    this.minArgsCount = R.reject(
      (arg: ASTInstructionMatcherSchema) => arg.optional,
      argsSchema,
    ).length;
  }

  get byteSize() { return this.binarySchema.length; }
}
