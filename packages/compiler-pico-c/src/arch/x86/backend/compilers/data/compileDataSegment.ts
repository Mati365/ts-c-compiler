import { IROpcode } from 'frontend/ir/constants';
import { IRDefDataInstruction } from 'frontend/ir/instructions';
import { IRDataSegmentBuilderResult } from 'frontend/ir/generator';
import { CCompilerArch } from '#constants';

import { X86LabelsResolver } from '../../X86LabelsResolver';
import { compileDefDataInstruction } from './compileDefDataInstruction';
import { X86CompileInstructionOutput } from '../shared';

type DataSegmentCompilerAttrs = {
  arch: CCompilerArch;
  segment: IRDataSegmentBuilderResult;
};

export function compileDataSegment({
  segment,
  arch,
}: DataSegmentCompilerAttrs) {
  const output = new X86CompileInstructionOutput();
  const labelsResolver = new X86LabelsResolver();

  for (const instruction of segment.instructions) {
    switch (instruction.opcode) {
      case IROpcode.DEF_DATA:
        output.appendGroup(
          compileDefDataInstruction({
            instruction: instruction as IRDefDataInstruction,
            labelsResolver,
            arch,
          }),
        );
        break;
    }
  }

  return {
    output,
    labelsResolver,
  };
}
