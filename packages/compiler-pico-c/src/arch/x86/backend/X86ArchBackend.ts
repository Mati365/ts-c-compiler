import { IRScopeGeneratorResult } from '@compiler/pico-c/frontend/ir/generator';
import { CAbstractArchBackend } from '@compiler/pico-c/backend/abstract/CAbstractArchBackend';
import { CBackendCompilerResult } from '@compiler/pico-c/backend/constants/types';

import { X86Allocator } from './X86Allocator';
import { BackendCompilerContext } from '../constants/types';

import { compileDataSegment, compileInstructionsBlock } from './compilers';

export class X86ArchBackend extends CAbstractArchBackend {
  private allocator: X86Allocator;

  get context(): BackendCompilerContext {
    const { allocator } = this;

    return {
      allocator,
    };
  }

  compileIR({ segments }: IRScopeGeneratorResult): CBackendCompilerResult {
    const asm: string[] = [];

    this.allocator = new X86Allocator(this.config);

    for (const [, block] of Object.entries(segments.code.blocks)) {
      asm.push(
        ...compileInstructionsBlock({
          context: this.context,
          block,
        }),
      );
    }

    asm.push(
      ...compileDataSegment({
        segment: segments.data,
      }),
    );

    return {
      asm: asm.join('\n'),
    };
  }
}
