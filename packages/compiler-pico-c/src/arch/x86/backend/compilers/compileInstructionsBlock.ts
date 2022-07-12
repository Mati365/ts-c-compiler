import {IROpcode} from '@compiler/pico-c/frontend/ir/constants';
import {
  IRCommentInstruction,
  IRInstructionsBlock,
} from '@compiler/pico-c/frontend/ir/instructions';

import {CompilerFnAttrs} from '../../constants/types';
import {genComment} from '../../asm-utils';
import {compileFnDeclInstructionsBlock} from './compileFnDeclInstructionsBlock';

type InstructionBlockCompilerAttrs = CompilerFnAttrs & {
  block: IRInstructionsBlock;
};

export function compileInstructionsBlock(
  {
    block,
    context,
  }: InstructionBlockCompilerAttrs,
): string[] {
  const {instructions} = block;
  const asm: string[] = [];

  for (let offset = 0; offset < instructions.length;) {
    const instruction = instructions[offset];
    let blockInstruction = false;

    switch (instruction.opcode) {
      case IROpcode.COMMENT:
        asm.push(
          genComment((<IRCommentInstruction> instruction).comment),
        );
        break;

      case IROpcode.FN_DECL: {
        const result = compileFnDeclInstructionsBlock(
          {
            instructions,
            context,
            offset,
          },
        );

        blockInstruction = true;
        offset = result.offset;
        asm.push(...result.asm, '');
      } break;
    }

    if (!blockInstruction) {
      ++offset;
    }
  }

  return asm;
}
