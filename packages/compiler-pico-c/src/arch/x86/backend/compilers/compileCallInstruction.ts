import {
  IRCallInstruction,
  isIRFnDeclInstruction,
} from '@compiler/pico-c/frontend/ir/instructions';

import {
  CBackendError,
  CBackendErrorCode,
} from '@compiler/pico-c/backend/errors/CBackendError';

import { getSourceNonPtrType } from '@compiler/pico-c/frontend/analyze/types/utils';
import {
  isIRLabel,
  isIRVariable,
} from '@compiler/pico-c/frontend/ir/variables';
import { isFuncDeclLikeType } from '@compiler/pico-c/frontend/analyze';

import { X86CompilerInstructionFnAttrs } from '../../constants/types';
import { getX86FnCaller } from '../call-conventions';

type CallInstructionCompilerAttrs =
  X86CompilerInstructionFnAttrs<IRCallInstruction>;

export function compileCallInstruction({
  instruction,
  context,
}: CallInstructionCompilerAttrs) {
  const { labelsResolver, allocator } = context;
  const { fnPtr } = instruction;

  // handle normal call
  if (isIRLabel(fnPtr)) {
    const labelResult = labelsResolver.getLabel(fnPtr.name);

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

  if (isIRVariable(fnPtr)) {
    const nonPtrType = getSourceNonPtrType(fnPtr.type);

    if (!nonPtrType || !isFuncDeclLikeType(nonPtrType)) {
      throw new CBackendError(CBackendErrorCode.CALL_ON_NON_CALLABLE_TYPE);
    }

    const address = allocator.regs.tryResolveIrArg({
      arg: fnPtr,
    });

    const caller = getX86FnCaller(nonPtrType.callConvention);

    console.info({ address, caller });
    throw new Error('TODO: Add implementation!');
  }

  throw new CBackendError(CBackendErrorCode.CALL_ON_NON_CALLABLE_TYPE);
}
