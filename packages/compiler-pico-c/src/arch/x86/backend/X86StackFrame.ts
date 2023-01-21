import { CCompilerArch, CCompilerConfig } from '@compiler/pico-c/constants';

import { assertUnreachable } from '@compiler/core/utils';
import { genRelAddress } from '../asm-utils';

type X86StackVariable = {
  offset: number;
  size: number;
};

export class X86StackFrame {
  private allocated: number = 0;
  private stackVars: { [id: string]: X86StackVariable } = {};

  constructor(readonly config: CCompilerConfig) {}

  getStackVar(id: string): X86StackVariable {
    return this.stackVars[id];
  }

  isStackVar(id: string): boolean {
    return !!this.getStackVar(id);
  }

  getStackVarOffset(id: string): number {
    return this.getStackVar(id).offset;
  }

  private allocBytes(bytes: number) {
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

  getLocalVarStackRelAddress(id: string, offset: number = 0) {
    const { arch } = this.config;
    const stackOffset = this.getStackVarOffset(id);

    switch (arch) {
      case CCompilerArch.X86_16:
        return genRelAddress('bp', stackOffset + offset);

      default:
        assertUnreachable(arch);
    }
  }
}
