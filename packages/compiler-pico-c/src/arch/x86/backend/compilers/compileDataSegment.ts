import {IROpcode} from '@compiler/pico-c/frontend/ir/constants';
import {IRDefConstInstruction} from '@compiler/pico-c/frontend/ir/instructions';
import {IRDataSegmentBuilderResult} from '@compiler/pico-c/frontend/ir/generator';

import {
  genDefConst,
  genLabel,
} from '../../asm-utils';

type DataSegmentCompilerAttrs = {
  segment: IRDataSegmentBuilderResult;
};

export function compileDataSegment(
  {
    segment,
  }: DataSegmentCompilerAttrs,
): string[] {
  const asm: string[] = [];

  for (const instruction of segment.instructions) {
    switch (instruction.opcode) {
      case IROpcode.DEF_CONST: {
        const defConst = <IRDefConstInstruction> instruction;

        asm.push(
          `${genLabel(defConst.outputVar.name)} ${genDefConst('db', <number[]> defConst.initializer.fields)}`,
        );
      } break;
    }
  }

  return asm;
}
