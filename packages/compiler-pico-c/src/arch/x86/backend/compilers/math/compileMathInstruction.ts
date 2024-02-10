import { X86CompilerInstructionFnAttrs } from 'arch/x86/constants/types';
import { isPrimitiveLikeType } from 'frontend/analyze';
import { IRMathInstruction } from 'frontend/ir/instructions';

import { compileIntMathInstruction } from './int';
import { compileX87MathInstruction } from './x87';

type MathInstructionCompilerAttrs = X86CompilerInstructionFnAttrs<IRMathInstruction>;

export function compileMathInstruction(attrs: MathInstructionCompilerAttrs) {
  const { outputVar } = attrs.instruction;

  if (isPrimitiveLikeType(outputVar.type, true) && outputVar.type.isFloating()) {
    return compileX87MathInstruction(attrs);
  }

  return compileIntMathInstruction(attrs);
}
