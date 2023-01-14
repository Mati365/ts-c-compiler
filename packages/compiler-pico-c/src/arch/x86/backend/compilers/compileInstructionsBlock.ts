import { IROpcode } from '@compiler/pico-c/frontend/ir/constants';
import {
  IRCommentInstruction,
  IRFnDeclInstruction,
  IRInstructionsBlock,
} from '@compiler/pico-c/frontend/ir/instructions';

import { isIRBranchInstruction } from '@compiler/pico-c/frontend/ir/guards';

import { CompilerFnAttrs } from '../../constants/types';
import { IRBlockIterator } from '../iterators/IRBlockIterator';

import { genComment } from '../../asm-utils';
import { compileFnDeclInstructionsBlock } from './compileFnDeclInstructionsBlock';

type InstructionBlockCompilerAttrs = Omit<CompilerFnAttrs, 'iterator'> & {
  block: IRInstructionsBlock;
};

export function compileInstructionsBlock({
  block,
  context,
}: InstructionBlockCompilerAttrs): string[] {
  const { instructions } = block;
  const asm: string[] = [];

  IRBlockIterator.of(instructions).walk((instruction, iterator) => {
    if (isIRBranchInstruction(instruction)) {
      context.allocator.regs.spillAllRegs();
    }

    switch (instruction.opcode) {
      case IROpcode.COMMENT:
        asm.push(genComment((instruction as IRCommentInstruction).comment));
        break;

      case IROpcode.FN_DECL: {
        const result = compileFnDeclInstructionsBlock({
          instruction: instruction as IRFnDeclInstruction,
          iterator,
          instructions,
          context,
        });

        asm.push(...result.asm, '');
      }
    }
  });

  return asm;
}
