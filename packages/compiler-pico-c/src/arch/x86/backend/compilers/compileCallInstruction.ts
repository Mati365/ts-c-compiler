import {
  IRCallInstruction,
  isIRFnDeclInstruction,
} from '@compiler/pico-c/frontend/ir/instructions';

import {
  CBackendError,
  CBackendErrorCode,
} from '@compiler/pico-c/backend/errors/CBackendError';

import { X86CompilerInstructionFnAttrs } from '../../constants/types';
import { isIRLabel } from '@compiler/pico-c/frontend/ir/variables';
import { getX86FnCaller } from '../call-conventions';

type CallInstructionCompilerAttrs =
  X86CompilerInstructionFnAttrs<IRCallInstruction>;

export function compileCallInstruction({
  instruction,
  context,
}: CallInstructionCompilerAttrs) {
  const { labelsResolver } = context;
  const { fnPtr } = instruction;

  const labelResult = isIRLabel(fnPtr)
    ? labelsResolver.getLabel(fnPtr.name)
    : null;

  if (!isIRFnDeclInstruction(labelResult.instruction)) {
    throw new CBackendError(CBackendErrorCode.CALL_ON_NON_CALLABLE_TYPE);
  }

  const caller = getX86FnCaller(labelResult.instruction.type.callConvention);

  return caller.compileIRFnCall({
    callerInstruction: instruction,
    declInstruction: labelResult.instruction,
    address: labelResult.asmLabel,
    context,
  });
}
