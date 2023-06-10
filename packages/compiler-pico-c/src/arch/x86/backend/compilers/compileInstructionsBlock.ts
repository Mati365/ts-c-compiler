import { IROpcode } from '@compiler/pico-c/frontend/ir/constants';
import {
  IRCommentInstruction,
  IRFnDeclInstruction,
} from '@compiler/pico-c/frontend/ir/instructions';

import { X86CompilerFnAttrs } from '../../constants/types';

import { genComment } from '../../asm-utils';
import { compileFnDeclInstructionsBlock } from './compileFnDeclInstructionsBlock';

type InstructionBlockCompilerAttrs = X86CompilerFnAttrs;

export function compileInstructionsBlock({
  context,
}: InstructionBlockCompilerAttrs): string[] {
  const asm: string[] = [];

  context.iterator.walk(instruction => {
    switch (instruction.opcode) {
      case IROpcode.COMMENT:
        asm.push(genComment((instruction as IRCommentInstruction).comment));
        break;

      case IROpcode.FN_DECL: {
        const result = compileFnDeclInstructionsBlock({
          instruction: instruction as IRFnDeclInstruction,
          context,
        });

        asm.push(...result.asm, '');
      }
    }
  });

  // console.info(asm.join('\n'));

  return asm;
}
