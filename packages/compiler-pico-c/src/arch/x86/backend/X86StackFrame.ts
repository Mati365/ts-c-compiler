import {CCompilerArch, CCompilerConfig} from '@compiler/pico-c/constants';

import {assertUnreachable} from '@compiler/core/utils';
import {genRelAddress} from '../asm-utils';

export class X86StackFrame {
  private allocated: number = 0;
  private stackVars: {[id: string]: number} = {};

  constructor(
    readonly config: CCompilerConfig,
  ) {}

  getStackVarOffset(id: string): number {
    return this.stackVars[id];
  }

  allocBytes(bytes: number) {
    this.allocated += bytes;
    return -this.allocated;
  }

  allocLocalVariable(id: string, bytes: number): number {
    const offset = this.allocBytes(bytes);
    this.stackVars[id] = offset;
    return offset;
  }

  genLocalVarStackRelAddress(id: string) {
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
