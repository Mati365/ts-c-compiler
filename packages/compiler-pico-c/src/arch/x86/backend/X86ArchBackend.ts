import { IRBlockIterator } from '@compiler/pico-c/frontend/ir/iterator/IRBlockIterator';
import { CCompilerArch } from '@compiler/pico-c/constants';
import { CAbstractArchBackend } from '@compiler/pico-c/backend/abstract/CAbstractArchBackend';
import { CBackendCompilerResult } from '@compiler/pico-c/backend/constants/types';

import {
  IRScopeGeneratorResult,
  IRFlatCodeSegmentBuilderResult,
} from '@compiler/pico-c/frontend/ir/generator';

import { X86Allocator } from './X86Allocator';
import { X86BackendCompilerContext } from '../constants/types';
import {
  X86BackendCompiledFunctions,
  X86FunctionResolver,
} from './X86FunctionResolver';

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
    const compiledFunctions: X86BackendCompiledFunctions = {};

    for (const [, fn] of Object.entries(codeSegment.functions)) {
      const { name } = fn.declaration;

      const iterator = IRBlockIterator.of(fn.block.instructions);
      const allocator = new X86Allocator(this.config, iterator);
      const fnResolver = new X86FunctionResolver(compiledFunctions);

      const context: X86BackendCompilerContext = {
        arch: X86ArchBackend.arch,
        archDescriptor: getCompilerArchDescriptor(X86ArchBackend.arch),
        codeSegment,
        iterator,
        allocator,
        fnResolver,
      };

      compiledFunctions[name] = {
        ...fn,
        asm: {
          code: compileInstructionsBlock({ context }),
          label: allocator.getLabel(name),
        },
      };
    }

    const asm = Object.values(compiledFunctions).reduce((acc, fn) => {
      acc.push(...fn.asm.code);
      return acc;
    }, [] as string[]);

    return asm;
  }
}
