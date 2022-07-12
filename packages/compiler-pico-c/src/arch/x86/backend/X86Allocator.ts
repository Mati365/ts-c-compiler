import {assertUnreachable} from '@compiler/core/utils';

import {CCompilerArch, CCompilerConfig} from '@compiler/pico-c/constants';
import {X86StackFrame} from './X86StackFrame';
import {genInstruction, genLabel} from '../asm-utils';

export class X86Allocator {
  private readonly labels: {[id: string]: string} = {};
  protected stackFrame: X86StackFrame;

  constructor(
    readonly config: CCompilerConfig,
  ) {}

  getCurrentStackFrame() {
    return this.stackFrame;
  }

  getLabel(id: string) {
    return this.labels[id];
  }

  allocLabelInstruction(type: 'fn', id: string) {
    const instruction = genLabel(`${type}_${id}`);

    this.labels[id] = instruction;
    return instruction;
  }

  allocStackFrameInstructions(content: () => string[]): string[] {
    const {config} = this;
    const {arch} = config;

    this.stackFrame = new X86StackFrame(config);

    switch (arch) {
      case CCompilerArch.X86_16:
        return [
          genInstruction('push', 'bp'),
          genInstruction('mov', 'bp', 'sp'),
          ...content(),
          genInstruction('pop', 'bp'),
        ];

      default:
        assertUnreachable(arch);
    }
  }
}
