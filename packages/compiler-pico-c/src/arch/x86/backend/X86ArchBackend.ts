import { IRBlockIterator } from 'frontend/ir/iterator/IRBlockIterator';
import { CCompilerArch } from '#constants';
import { CAbstractArchBackend } from 'backend/abstract/CAbstractArchBackend';
import { CBackendCompilerResult } from 'backend/constants/types';

import {
  IRScopeGeneratorResult,
  IRFlatCodeSegmentBuilderResult,
} from 'frontend/ir/generator';

import { X86Allocator } from './X86Allocator';
import { X86BackendCompilerContext } from '../constants/types';

import {
  X86CompileInstructionOutput,
  compileDataSegment,
  compileInstructionsBlock,
} from './compilers';

import { getCompilerArchDescriptor } from '../../../arch';
import { X86LabelsResolver } from './X86LabelsResolver';

export class X86ArchBackend extends CAbstractArchBackend {
  static readonly arch = CCompilerArch.X86_16;
  static readonly cpu = '386';

  compileIR({ segments }: IRScopeGeneratorResult): CBackendCompilerResult {
    const asm: string[] = [`cpu ${X86ArchBackend.cpu}`];
    const dataOutput = compileDataSegment({
      arch: X86ArchBackend.arch,
      segment: segments.data,
    });

    const functionsOutput = this.compileIRFunctions(
      dataOutput.labelsResolver,
      segments.code,
    );

    asm.push(
      ...functionsOutput.asm,
      ...functionsOutput.data,
      ...dataOutput.output.asm,
    );

    return {
      asm: asm.join('\n'),
    };
  }

  private compileIRFunctions(
    labelsResolver: X86LabelsResolver,
    codeSegment: IRFlatCodeSegmentBuilderResult,
  ) {
    const output = new X86CompileInstructionOutput();

    for (const [, fn] of Object.entries(codeSegment.functions)) {
      const iterator = IRBlockIterator.of(fn.block.instructions);
      const allocator = new X86Allocator(this.config, iterator, labelsResolver);

      const context: X86BackendCompilerContext = {
        arch: X86ArchBackend.arch,
        archDescriptor: getCompilerArchDescriptor(X86ArchBackend.arch),
        codeSegment,
        iterator,
        allocator,
        labelsResolver,
      };

      output.appendGroup(compileInstructionsBlock({ context }));
    }

    return output;
  }
}
