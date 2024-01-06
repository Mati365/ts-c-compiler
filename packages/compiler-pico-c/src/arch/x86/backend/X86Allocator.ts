import { assertUnreachable } from '@ts-c-compiler/core';

import { CCompilerArch, CCompilerConfig } from '../../../constants';
import type { IRBlockIterator } from '../../../frontend/ir/iterator';

import { X86StackFrame } from './X86StackFrame';
import { X86BasicRegAllocator, X87BasicRegAllocator } from './reg-allocator';
import { genInstruction } from '../asm-utils';
import { X86CompileInstructionOutput } from './compilers';
import { X86VarLifetimeGraph } from './reg-allocator/X86VarLifetimeGraph';
import { X86LabelsResolver } from './X86LabelsResolver';

export type X86StackFrameContentFn = () => X86CompileInstructionOutput;

export class X86Allocator {
  private _stackFrame: X86StackFrame;
  private _regs: X86BasicRegAllocator;
  private _x87Regs: X87BasicRegAllocator;

  constructor(
    readonly config: CCompilerConfig,
    readonly iterator: IRBlockIterator,
    readonly labelsResolver: X86LabelsResolver,
  ) {
    const lifetime = new X86VarLifetimeGraph(iterator.instructions);

    this._regs = new X86BasicRegAllocator(lifetime, this);
    this._x87Regs = new X87BasicRegAllocator(this);
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

  get x87regs() {
    return this._x87Regs;
  }

  /**
   * Allocates whole function declaration IR code and injects code into it
   */
  allocStackFrameInstructions(
    contentFn: X86StackFrameContentFn,
  ): X86CompileInstructionOutput {
    const { config } = this;
    const { arch } = config;

    this._stackFrame = new X86StackFrame(config);

    switch (arch) {
      case CCompilerArch.X86_16: {
        const content = contentFn();

        return X86CompileInstructionOutput.ofInstructions([
          this.genFnTopStackFrame(),
          content,
        ]);
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

    return X86CompileInstructionOutput.ofInstructions(asm);
  }

  genFnBottomStackFrame() {
    return X86CompileInstructionOutput.ofInstructions([
      genInstruction('mov', 'sp', 'bp'),
      genInstruction('pop', 'bp'),
    ]);
  }
}
