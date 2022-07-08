import {
  IRDataSegmentBuilderResult,
  IRScopeGeneratorResult,
} from '@compiler/pico-c/frontend/ir/generator';

import {
  IRCommentInstruction,
  IRDefConstInstruction,
  IRInstructionsBlock,
} from '@compiler/pico-c/frontend/ir/instructions';

import {CAbstractArchBackend} from '@compiler/pico-c/backend/abstract/CAbstractArchBackend';
import {CBackendCompilerResult} from '@compiler/pico-c/backend/constants/types';
import {IROpcode} from '@compiler/pico-c/frontend/ir/constants';

import {
  genLabel,
  genComment,
  genDefConst,
} from '../asm-utils';

export class X86ArchBackend extends CAbstractArchBackend {
  compileIR(
    {
      segments,
    }: IRScopeGeneratorResult,
  ): CBackendCompilerResult {
    const asm: string[] = [];

    for (const [, code] of Object.entries(segments.code.blocks))
      asm.push(...this.compileInstructionsBlock(code));

    asm.push(...this.compileDataSegment(segments.data));

    return {
      asm: asm.join('\n'),
    };
  }

  private compileInstructionsBlock(code: IRInstructionsBlock): string[] {
    const asm: string[] = [];

    for (const instruction of code.instructions) {
      switch (instruction.opcode) {
        case IROpcode.COMMENT:
          asm.push(
            genComment((<IRCommentInstruction> instruction).comment),
          );
          break;
      }
    }

    return asm;
  }

  private compileDataSegment({instructions}: IRDataSegmentBuilderResult): string[] {
    const asm: string[] = [];

    for (const instruction of instructions) {
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
}
