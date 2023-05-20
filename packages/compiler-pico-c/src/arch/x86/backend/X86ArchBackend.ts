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

import { compileDataSegment, compileInstructionsBlock } from './compilers';
import { getCompilerArchDescriptor } from '../../../arch';
import { X86LabelsResolver } from './X86LabelsResolver';

export class X86ArchBackend extends CAbstractArchBackend {
  static readonly arch = CCompilerArch.X86_16;
  static readonly cpu = '386';

  compileIR({ segments }: IRScopeGeneratorResult): CBackendCompilerResult {
    const asm: string[] = [`cpu ${X86ArchBackend.cpu}`];
    const { labelsResolver, asm: dataAsm } = compileDataSegment({
      arch: X86ArchBackend.arch,
      segment: segments.data,
    });

    asm.push(
      ...this.compileIRFunctions(labelsResolver, segments.code),
      ...dataAsm,
    );

    return {
      asm: asm.join('\n'),
    };
  }

  private compileIRFunctions(
    labelsResolver: X86LabelsResolver,
    codeSegment: IRFlatCodeSegmentBuilderResult,
  ): string[] {
    const asm: string[] = [];

    for (const [, fn] of Object.entries(codeSegment.functions)) {
      const iterator = IRBlockIterator.of(fn.block.instructions);
      const allocator = new X86Allocator(this.config, iterator);

      const context: X86BackendCompilerContext = {
        arch: X86ArchBackend.arch,
        archDescriptor: getCompilerArchDescriptor(X86ArchBackend.arch),
        codeSegment,
        iterator,
        allocator,
        labelsResolver,
      };

      asm.push(...compileInstructionsBlock({ context }));
    }

    return asm;
  }
}
