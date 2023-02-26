import { assertUnreachable } from '@compiler/core/utils';
import { CCompilerArch, CCompilerConfig } from '@compiler/pico-c/constants';
import { IRBlockIterator } from '@compiler/pico-c/frontend/ir/iterator/IRBlockIterator';

import { X86StackFrame } from './X86StackFrame';
import { X86BasicRegAllocator } from './reg-allocator';
import { genInstruction, genLabelName } from '../asm-utils';

export type X86StackFrameContentFn = () => { asm: string[] };

export class X86Allocator {
  private readonly labels: { [id: string]: string } = {};

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

  getLabel(id: string) {
    return this.labels[id];
  }

  /**
   * Allocates plain jmp label
   */
  allocLabel(type: 'fn', id: string): string {
    const label = genLabelName(`${type}_${id}`);

    this.labels[id] = label;
    return label;
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

        return [
          genInstruction('push', 'bp'),
          genInstruction('mov', 'bp', 'sp'),
          ...content.asm,
        ];
      }

      default:
        assertUnreachable(arch);
    }
  }
}
