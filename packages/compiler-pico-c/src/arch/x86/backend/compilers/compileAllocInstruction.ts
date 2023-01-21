import { IRAllocInstruction } from '@compiler/pico-c/frontend/ir/instructions';
import { CompilerFnAttrs } from '../../constants/types';

type AllocInstructionCompilerAttrs = CompilerFnAttrs & {
  instruction: IRAllocInstruction;
};

export function compileAllocInstruction({
  instruction,
  context,
}: AllocInstructionCompilerAttrs) {
  const { allocator } = context;
  const { outputVar } = instruction;

  allocator.stackFrame.allocLocalVariable(
    outputVar.name,
    outputVar.getStackAllocByteSize(),
  );
}
