import {
  IRFnDeclInstruction,
  IRRetInstruction,
} from '@compiler/pico-c/frontend/ir/instructions';

import { X86CompilerInstructionFnAttrs } from '../../constants/types';
import { getX86FnCaller } from '../call-conventions';

type RetInstructionCompilerAttrs =
  X86CompilerInstructionFnAttrs<IRRetInstruction> & {
    fnInstruction: IRFnDeclInstruction;
  };

export function compileRetInstruction({
  context,
  instruction,
  fnInstruction,
}: RetInstructionCompilerAttrs) {
  return getX86FnCaller(fnInstruction.type.callConvention).compileIRFnRet({
    declInstruction: fnInstruction,
    retInstruction: instruction,
    context,
  });
}
