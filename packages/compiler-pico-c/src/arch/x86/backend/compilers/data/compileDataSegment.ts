import { IROpcode } from '@compiler/pico-c/frontend/ir/constants';
import { IRDefDataInstruction } from '@compiler/pico-c/frontend/ir/instructions';
import { IRDataSegmentBuilderResult } from '@compiler/pico-c/frontend/ir/generator';
import { compileDefDataInstruction } from './compileDefDataInstruction';

type DataSegmentCompilerAttrs = {
  segment: IRDataSegmentBuilderResult;
};

export function compileDataSegment({
  segment,
}: DataSegmentCompilerAttrs): string[] {
  const asm: string[] = [];

  for (const instruction of segment.instructions) {
    switch (instruction.opcode) {
      case IROpcode.DEF_DATA:
        asm.push(
          ...compileDefDataInstruction({
            instruction: instruction as IRDefDataInstruction,
          }),
        );
        break;
    }
  }

  return asm;
}
