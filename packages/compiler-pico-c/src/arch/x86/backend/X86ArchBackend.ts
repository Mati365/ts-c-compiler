import { IRBlockIterator } from '@compiler/pico-c/frontend/ir/iterator/IRBlockIterator';
import { CCompilerArch } from '@compiler/pico-c/constants';
import { CAbstractArchBackend } from '@compiler/pico-c/backend/abstract/CAbstractArchBackend';
import { CBackendCompilerResult } from '@compiler/pico-c/backend/constants/types';

import {
  IRScopeGeneratorResult,
  IRFlatCodeSegmentBuilderResult,
} from '@compiler/pico-c/frontend/ir/generator';

import { BackendCompiledFunctions } from '../constants/types';
import { X86Allocator } from './X86Allocator';
import { compileDataSegment, compileInstructionsBlock } from './compilers';
import { getCompilerArchDescriptor } from '../../../arch';

export class X86ArchBackend extends CAbstractArchBackend {
  static readonly arch = CCompilerArch.X86_16;
  static readonly cpu = '386';

  compileIR({ segments }: IRScopeGeneratorResult): CBackendCompilerResult {
    const asm: string[] = [`cpu ${X86ArchBackend.cpu}`];

    asm.push(
      ...this.compileIRFunctions(segments.code),
      ...compileDataSegment({
        segment: segments.data,
      }),
    );

    return {
      asm: asm.join('\n'),
    };
  }

  private compileIRFunctions(
    codeSegment: IRFlatCodeSegmentBuilderResult,
  ): string[] {
    const compiledFunctions: BackendCompiledFunctions = {};

    for (const [, fn] of Object.entries(codeSegment.functions)) {
      const iterator = IRBlockIterator.of(fn.block.instructions);
      const allocator = new X86Allocator(this.config, iterator);

      compiledFunctions[fn.declaration.name] = {
        ...fn,
        asm: compileInstructionsBlock({
          context: {
            arch: X86ArchBackend.arch,
            archDescriptor: getCompilerArchDescriptor(X86ArchBackend.arch),
            codeSegment,
            iterator,
            allocator,
            compiled: {
              functions: compiledFunctions,
            },
          },
        }),
      };
    }

    return Object.values(compiledFunctions).reduce((acc, { asm }) => {
      acc.push(...asm);
      return acc;
    }, [] as string[]);
  }
}
