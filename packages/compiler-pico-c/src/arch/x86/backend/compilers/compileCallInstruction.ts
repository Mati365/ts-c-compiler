import { IRCallInstruction } from '@compiler/pico-c/frontend/ir/instructions';
import { X86CompilerInstructionFnAttrs } from '../../constants/types';

import { isIRLabel } from '@compiler/pico-c/frontend/ir/variables';
import { getX86FnCaller } from '../call-conventions';

type CallInstructionCompilerAttrs =
  X86CompilerInstructionFnAttrs<IRCallInstruction>;

export function compileCallInstruction({
  instruction,
  context,
}: CallInstructionCompilerAttrs) {
  const { fnResolver } = context;
  const { fnPtr } = instruction;

  const target = isIRLabel(fnPtr)
    ? fnResolver.tryResolveFnBlock(fnPtr.name)
    : null;

  return getX86FnCaller(target.declaration.type.callConvention).compileIRFnCall(
    {
      callerInstruction: instruction,
      context,
      target,
    },
  );
}
