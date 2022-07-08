import {assertUnreachable} from '@compiler/core/utils';

import {CCompilerArch, CCompilerConfig} from '@compiler/pico-c/constants';
import {X86StackFrame} from './X86StackFrame';
import {X86Label} from './variables';
import {genInstruction, genLabel} from '../asm-utils';

export class X86Allocator {
  readonly labels: {[id: string]: string} = {};
  readonly tmpVars: {[id: string]: X86Label | X86StackFrame} = {};

  protected stackFrame: X86StackFrame;

  constructor(
    readonly config: CCompilerConfig,
  ) {}

  allocLabelInstruction(type: 'fn', id: string) {
    const instruction = genLabel(`${type}_${id}`);

    this.labels[id] = instruction;
    return instruction;
  }

  allocStackFrameInstructions(content: () => string[]): string[] {
    const {arch} = this.config;

    this.stackFrame = new X86StackFrame;

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
