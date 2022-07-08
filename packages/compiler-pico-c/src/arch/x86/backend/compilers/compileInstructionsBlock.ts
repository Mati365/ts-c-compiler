import {IROpcode} from '@compiler/pico-c/frontend/ir/constants';
import {
  IRCommentInstruction,
  IRFnDeclInstruction,
  IRInstructionsBlock,
} from '@compiler/pico-c/frontend/ir/instructions';

import {CompilerFnAttrs} from '../../constants/types';
import {genComment} from '../../asm-utils';
import {compileFnDeclInstruction} from './compileFnDeclInstruction';

type InstructionBlockCompilerAttrs = CompilerFnAttrs & {
  block: IRInstructionsBlock;
};

export function compileInstructionsBlock(
  {
    block,
    context,
  }: InstructionBlockCompilerAttrs,
): string[] {
  const asm: string[] = [];
  let compiledFn: IRFnDeclInstruction = null;

  for (const instruction of block.instructions) {
    switch (instruction.opcode) {
      case IROpcode.COMMENT:
        asm.push(
          genComment((<IRCommentInstruction> instruction).comment),
        );
        break;

      case IROpcode.LABEL_OFFSET:
        break;

      case IROpcode.FN_DECL: {
        compiledFn = <IRFnDeclInstruction> instruction;
        asm.push(
          ...compileFnDeclInstruction(
            {
              context,
              instruction: compiledFn,
            },
          ),
          '',
        );
      } break;

      case IROpcode.RET:
        break;
    }
  }

  return asm;
}
