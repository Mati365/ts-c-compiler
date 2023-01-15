import { IROpcode } from '@compiler/pico-c/frontend/ir/constants';
import {
  IRCommentInstruction,
  IRFnDeclInstruction,
} from '@compiler/pico-c/frontend/ir/instructions';

import {
  CompiledBlockOutput,
  CompilerBlockFnAttrs,
} from '../../constants/types';

import { IRBlockIterator } from '../iterators/IRBlockIterator';

import { genComment } from '../../asm-utils';
import { compileAllocInstruction } from './compileAllocInstruction';
import { compileStoreInstruction } from './compileStoreInstruction';
import { compileLoadInstruction } from './compileLoadInstruction';
import { compileMathInstruction } from './compileMathInstruction';

type FnDeclCompilerBlockFnAttrs = CompilerBlockFnAttrs & {
  instruction: IRFnDeclInstruction;
};

export function compileFnDeclInstructionsBlock({
  instruction: fnInstruction,
  instructions,
  context,
}: FnDeclCompilerBlockFnAttrs): CompiledBlockOutput {
  const { allocator } = context;

  const compileFnContent = (): string[] => {
    const asm: string[] = [];

    IRBlockIterator.of(instructions).walk((instruction, iterator) => {
      const arg = {
        instruction: <any>instruction,
        context,
        iterator,
      };

      switch (instruction.opcode) {
        case IROpcode.ALLOC:
          compileAllocInstruction(arg);
          break;

        case IROpcode.LOAD:
          compileLoadInstruction(arg);
          break;

        case IROpcode.MATH:
          asm.push(...compileMathInstruction(arg));
          break;

        case IROpcode.STORE:
          asm.push(...compileStoreInstruction(arg));
          break;

        case IROpcode.COMMENT:
          asm.push(genComment((<IRCommentInstruction>instruction).comment));
          break;
      }
    });

    return asm;
  };

  allocator.regs.onAnalyzeInstructionsBlock(instructions);

  const asm = [
    genComment(fnInstruction.getDisplayName()),
    allocator.allocLabelInstruction('fn', fnInstruction.name),
    ...allocator.allocStackFrameInstructions(compileFnContent),
  ];

  return {
    asm,
  };
}
