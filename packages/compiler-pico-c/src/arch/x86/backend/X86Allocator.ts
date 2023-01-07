import { assertUnreachable } from '@compiler/core/utils';

import { CCompilerArch, CCompilerConfig } from '@compiler/pico-c/constants';
import { X86StackFrame } from './X86StackFrame';
import { X86AbstractRegAllocator } from './X86AbstractRegAllocator';
import { X86BasicRegAllocator } from './allocators';
import { genInstruction, genLabel } from '../asm-utils';

export class X86Allocator {
  private readonly labels: { [id: string]: string } = {};

  private _stackFrame: X86StackFrame;
  private _regs: X86AbstractRegAllocator;

  constructor(readonly config: CCompilerConfig) {}

  get stackFrame() {
    return this._stackFrame;
  }
  get regs() {
    return this._regs;
  }

  getLabel(id: string) {
    return this.labels[id];
  }

  allocRegAllocator() {
    this._regs = new X86BasicRegAllocator(this);
    return this._regs;
  }

  /**
   * Allocates plain jmp label
   */
  allocLabelInstruction(type: 'fn', id: string): string {
    const label = genLabel(`${type}_${id}`);

    this.labels[id] = label;
    return label;
  }

  /**
   * Allocates whole function declaration IR code and injects code into it
   */
  allocStackFrameInstructions(content: () => string[]): string[] {
    const { config } = this;
    const { arch } = config;

    this._stackFrame = new X86StackFrame(config);

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
