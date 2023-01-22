import { IRAllocInstruction } from '@compiler/pico-c/frontend/ir/instructions';
import { CompilerInstructionFnAttrs } from '../../constants/types';

type AllocInstructionCompilerAttrs =
  CompilerInstructionFnAttrs<IRAllocInstruction>;

export function compileAllocInstruction({
  instruction,
  context,
}: AllocInstructionCompilerAttrs) {
  const { outputVar } = instruction;
  const {
    allocator: { stackFrame, regs },
  } = context;

  const stackVar = stackFrame.allocLocalVariable(
    outputVar.name,
    outputVar.getStackAllocByteSize(),
  );

  regs.ownership.setOwnership(outputVar.name, { stackVar });
}
