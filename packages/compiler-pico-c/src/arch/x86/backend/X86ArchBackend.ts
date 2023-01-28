import { IRScopeGeneratorResult } from '@compiler/pico-c/frontend/ir/generator';
import { CAbstractArchBackend } from '@compiler/pico-c/backend/abstract/CAbstractArchBackend';
import { CBackendCompilerResult } from '@compiler/pico-c/backend/constants/types';

import { X86Allocator } from './X86Allocator';
import { compileDataSegment, compileInstructionsBlock } from './compilers';
import { IRBlockIterator } from './iterators/IRBlockIterator';

export class X86ArchBackend extends CAbstractArchBackend {
  compileIR({ segments }: IRScopeGeneratorResult): CBackendCompilerResult {
    const asm: string[] = [];

    for (const [, fn] of Object.entries(segments.code.functions)) {
      const iterator = IRBlockIterator.of(fn.block.instructions);
      const allocator = new X86Allocator(this.config, iterator);

      asm.push(
        ...compileInstructionsBlock({
          context: {
            iterator,
            allocator,
          },
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
