import {IRLoadInstruction} from '@compiler/pico-c/frontend/ir/instructions';
import {CompilerFnAttrs} from '../../constants/types';

type LoadInstructionCompilerAttrs = CompilerFnAttrs & {
  instruction: IRLoadInstruction;
};

export function compileLoadInstruction(
  {
    instruction,
    context,
  }: LoadInstructionCompilerAttrs,
) {
  context.allocator.regs.pushIRLoad(instruction);
}
