import { CCompilerArch, CCompilerConfig } from '@compiler/pico-c/constants';

import { assertUnreachable } from '@compiler/core/utils';
import { genMemAddress } from '../asm-utils';

export type X86StackVariable = {
  name: string;
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

  allocLocalVariable(name: string, size: number): X86StackVariable {
    const offset = this.allocBytes(size);
    const stackVar: X86StackVariable = {
      name,
      offset,
      size,
    };

    this.stackVars[name] = stackVar;
    return stackVar;
  }

  getLocalVarStackRelAddress(name: string, offset: number = 0) {
    const { arch } = this.config;
    const stackOffset = this.getStackVarOffset(name);

    switch (arch) {
      case CCompilerArch.X86_16:
        return genMemAddress({
          expression: 'bp',
          offset: stackOffset + offset,
        });

      default:
        assertUnreachable(arch);
    }
  }
}
