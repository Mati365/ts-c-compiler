import { getBaseTypeIfPtr } from 'frontend/analyze/types/utils';
import { IRAllocInstruction } from 'frontend/ir/instructions';
import { X86CompilerInstructionFnAttrs } from '../../constants/types';

type AllocInstructionCompilerAttrs = X86CompilerInstructionFnAttrs<IRAllocInstruction>;

export function compileAllocInstruction({
  instruction,
  context,
}: AllocInstructionCompilerAttrs) {
  const { outputVar } = instruction;
  const {
    allocator: { stackFrame, memOwnership },
  } = context;

  const stackVar = stackFrame.allocLocalVariable(
    outputVar.ofType(getBaseTypeIfPtr(outputVar.type)),
  );

  memOwnership.setOwnership(outputVar.name, {
    stackVar,
  });
}
