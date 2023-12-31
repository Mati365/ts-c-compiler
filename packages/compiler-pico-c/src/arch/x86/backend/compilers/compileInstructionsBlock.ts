import { IROpcode } from 'frontend/ir/constants';
import {
  IRCommentInstruction,
  IRFnDeclInstruction,
} from 'frontend/ir/instructions';

import { X86CompilerFnAttrs } from '../../constants/types';

import { genComment } from '../../asm-utils';
import { compileFnDeclInstructionsBlock } from './compileFnDeclInstructionsBlock';
import { X86CompileInstructionOutput } from './shared';

type InstructionBlockCompilerAttrs = X86CompilerFnAttrs;

export function compileInstructionsBlock({
  context,
}: InstructionBlockCompilerAttrs) {
  const output = new X86CompileInstructionOutput();

  context.iterator.walk(instruction => {
    switch (instruction.opcode) {
      case IROpcode.COMMENT:
        output.appendInstructions(
          genComment((instruction as IRCommentInstruction).comment),
        );
        break;

      case IROpcode.FN_DECL:
        output.appendGroup(
          compileFnDeclInstructionsBlock({
            instruction: instruction as IRFnDeclInstruction,
            context,
          }),
        );
    }
  });

  return output;
}
