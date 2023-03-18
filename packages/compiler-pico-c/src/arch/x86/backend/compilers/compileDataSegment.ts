import { IROpcode } from '@compiler/pico-c/frontend/ir/constants';
import { IRDefDataInstruction } from '@compiler/pico-c/frontend/ir/instructions';
import { IRDataSegmentBuilderResult } from '@compiler/pico-c/frontend/ir/generator';

import { genDefConst, genLabel } from '../../asm-utils';

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
        {
          const defConst = instruction as IRDefDataInstruction;

          asm.push(
            `${genLabel(defConst.outputVar.name)} ${genDefConst(
              'db',
              defConst.initializer.fields as number[],
            )}`,
          );
        }
        break;
    }
  }

  return asm;
}
