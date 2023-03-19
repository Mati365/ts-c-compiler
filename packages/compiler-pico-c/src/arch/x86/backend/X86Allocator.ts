import { assertUnreachable } from '@compiler/core/utils';
import { CCompilerArch, CCompilerConfig } from '@compiler/pico-c/constants';
import { IRBlockIterator } from '@compiler/pico-c/frontend/ir/iterator/IRBlockIterator';

import { X86StackFrame } from './X86StackFrame';
import { X86BasicRegAllocator } from './reg-allocator';
import { genInstruction } from '../asm-utils';

export type X86StackFrameContentFn = () => { asm: string[] };

export class X86Allocator {
  private _stackFrame: X86StackFrame;
  private _regs: X86BasicRegAllocator;

  constructor(
    readonly config: CCompilerConfig,
    readonly iterator: IRBlockIterator,
  ) {
    this._regs = new X86BasicRegAllocator(this);
  }

  get instructions() {
    return this.iterator.instructions;
  }

  get stackFrame() {
    return this._stackFrame;
  }

  get regs() {
    return this._regs;
  }

  /**
   * Allocates whole function declaration IR code and injects code into it
   */
  allocStackFrameInstructions(contentFn: X86StackFrameContentFn): string[] {
    const { config } = this;
    const { arch } = config;

    this._stackFrame = new X86StackFrame(config);

    switch (arch) {
      case CCompilerArch.X86_16: {
        const content = contentFn();

        return [...this.genFnTopStackFrame(), ...content.asm];
      }

      default:
        assertUnreachable(arch);
    }
  }

  genFnTopStackFrame() {
    const asm = [
      genInstruction('push', 'bp'),
      genInstruction('mov', 'bp', 'sp'),
    ];

    const allocBytes = this._stackFrame.getTotalAllocatedBytes();
    if (allocBytes > 0) {
      asm.push(genInstruction('sub', 'sp', allocBytes));
    }

    return asm;
  }

  genFnBottomStackFrame() {
    return [genInstruction('mov', 'sp', 'bp'), genInstruction('pop', 'bp')];
  }
}
