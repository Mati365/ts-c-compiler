import { IRScopeGeneratorResult } from '@compiler/pico-c/frontend/ir/generator';
import { IRBlockIterator } from '@compiler/pico-c/frontend/ir/iterator/IRBlockIterator';

import { CCompilerArch } from '@compiler/pico-c/constants';
import { CAbstractArchBackend } from '@compiler/pico-c/backend/abstract/CAbstractArchBackend';
import { CBackendCompilerResult } from '@compiler/pico-c/backend/constants/types';

import { X86Allocator } from './X86Allocator';
import { compileDataSegment, compileInstructionsBlock } from './compilers';
import { getCompilerArchDescriptor } from '../..';

export class X86ArchBackend extends CAbstractArchBackend {
  static readonly arch = CCompilerArch.X86_16;

  compileIR({ segments }: IRScopeGeneratorResult): CBackendCompilerResult {
    const asm: string[] = [];

    for (const [, fn] of Object.entries(segments.code.functions)) {
      const iterator = IRBlockIterator.of(fn.block.instructions);
      const allocator = new X86Allocator(this.config, iterator);

      asm.push(
        ...compileInstructionsBlock({
          context: {
            arch: X86ArchBackend.arch,
            archDescriptor: getCompilerArchDescriptor(X86ArchBackend.arch),
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

    console.info(asm.join('\n'));

    return {
      asm: asm.join('\n'),
    };
  }
}
