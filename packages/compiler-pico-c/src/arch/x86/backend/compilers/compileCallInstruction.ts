import { IRCallInstruction } from '@compiler/pico-c/frontend/ir/instructions';
import { CompilerInstructionFnAttrs } from '../../constants/types';

import { isIRLabel } from '@compiler/pico-c/frontend/ir/variables';
import { genInstruction } from '../../asm-utils';

type CallInstructionCompilerAttrs =
  CompilerInstructionFnAttrs<IRCallInstruction>;

export function compileCallInstruction({
  instruction,
  context,
}: CallInstructionCompilerAttrs) {
  const { fnResolver } = context;
  const callTarget = isIRLabel(instruction.fnPtr)
    ? fnResolver.tryResolveFnLabel(instruction.fnPtr.name)
    : 'todo';

  return [genInstruction('call', callTarget)];
}
