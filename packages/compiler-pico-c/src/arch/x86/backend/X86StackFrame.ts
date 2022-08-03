import {CCompilerArch, CCompilerConfig} from '@compiler/pico-c/constants';

import {assertUnreachable} from '@compiler/core/utils';
import {genRelAddress} from '../asm-utils';

type X86StackVariable = {
  offset: number;
  size: number;
};

export class X86StackFrame {
  private allocated: number = 0;
  private stackVars: {[id: string]: X86StackVariable} = {};

  constructor(
    readonly config: CCompilerConfig,
  ) {}

  getStackVar(id: string): X86StackVariable {
    return this.stackVars[id];
  }

  isStackVar(id: string): boolean {
    return !!this.getStackVar(id);
  }

  getStackVarOffset(id: string): number {
    return this.getStackVar(id).offset;
  }

  allocBytes(bytes: number) {
    this.allocated += bytes;
    return -this.allocated;
  }

  allocLocalVariable(id: string, size: number): number {
    const offset = this.allocBytes(size);

    this.stackVars[id] = {
      offset,
      size,
    };

    return offset;
  }

  getLocalVarStackRelAddress(id: string) {
    const {arch} = this.config;
    const offset = this.getStackVarOffset(id);

    switch (arch) {
      case CCompilerArch.X86_16:
        return genRelAddress('bp', offset);

      default:
        assertUnreachable(arch);
    }
  }
}
