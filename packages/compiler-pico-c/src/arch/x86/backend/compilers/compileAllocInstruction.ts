import { IRAllocInstruction } from '@compiler/pico-c/frontend/ir/instructions';
import { X86CompilerInstructionFnAttrs } from '../../constants/types';

type AllocInstructionCompilerAttrs =
  X86CompilerInstructionFnAttrs<IRAllocInstruction>;

export function compileAllocInstruction({
  instruction,
  context,
}: AllocInstructionCompilerAttrs) {
  const { outputVar } = instruction;
  const {
    allocator: { stackFrame, regs },
  } = context;

  regs.ownership.setOwnership(outputVar.name, {
    stackVar: stackFrame.allocLocalVariable(outputVar),
  });
}
