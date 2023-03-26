import { getBaseTypeIfPtr } from '@compiler/pico-c/frontend/analyze/types/utils';
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

  const stackVar = stackFrame.allocLocalVariable(
    outputVar.ofType(getBaseTypeIfPtr(outputVar.type)),
  );

  regs.ownership.setOwnership(outputVar.name, {
    stackVar,
  });
}
