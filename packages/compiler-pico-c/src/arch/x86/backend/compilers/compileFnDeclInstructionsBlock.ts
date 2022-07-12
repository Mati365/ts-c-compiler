import {IROpcode} from '@compiler/pico-c/frontend/ir/constants';
import {
  IRAllocInstruction,
  IRCommentInstruction,
  IRFnDeclInstruction,
  IRStoreInstruction,
  isIRFnEndDeclInstruction,
} from '@compiler/pico-c/frontend/ir/instructions';

import {CompiledBlockOutput, CompilerBlockFnAttrs} from '../../constants/types';

import {genComment} from '../../asm-utils';
import {compileAllocInstruction} from './compileAllocInstruction';
import {compileStoreInstruction} from './compileStoreInstruction';

export function compileFnDeclInstructionsBlock(
  {
    instructions,
    context,
    offset,
  }: CompilerBlockFnAttrs,
): CompiledBlockOutput {
  const {allocator} = context;
  const fnInstruction = <IRFnDeclInstruction> instructions[offset];
  let newOffset = offset + 1;

  const compileFnContent = (): string[] => {
    const asm: string[] = [];

    for (; newOffset < instructions.length && !isIRFnEndDeclInstruction(instructions[newOffset]); ++newOffset) {
      const instruction = instructions[newOffset];

      switch (instruction.opcode) {
        case IROpcode.ALLOC:
          compileAllocInstruction(
            {
              instruction: <IRAllocInstruction> instruction,
              context,
            },
          );
          break;

        case IROpcode.STORE:
          asm.push(
            compileStoreInstruction(
              {
                instruction: <IRStoreInstruction> instruction,
                context,
              },
            ),
          );
          break;

        case IROpcode.COMMENT:
          asm.push(
            genComment((<IRCommentInstruction> instruction).comment),
          );
          break;
      }
    }

    return asm;
  };

  return {
    offset: newOffset,
    asm: [
      genComment(fnInstruction.getDisplayName()),
      allocator.allocLabelInstruction('fn', fnInstruction.name),
      ...allocator.allocStackFrameInstructions(compileFnContent),
    ],
  };
}
