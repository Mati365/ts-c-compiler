import {
  IRCallInstruction,
  IRFnDeclInstruction,
  isIRFnDeclInstruction,
} from 'frontend/ir/instructions';

import { CBackendError, CBackendErrorCode } from 'backend/errors/CBackendError';

import { getSourceNonPtrType } from 'frontend/analyze/types/utils';
import { IRVariable, isIRLabel, isIRVariable } from 'frontend/ir/variables';
import { isFuncDeclLikeType } from 'frontend/analyze';

import { X86CompilerInstructionFnAttrs } from '../../constants/types';
import { getX86FnCaller } from '../call-conventions';
import { compileBuiltinCallFn } from './builtin';

type CallInstructionCompilerAttrs =
  X86CompilerInstructionFnAttrs<IRCallInstruction>;

export function compileCallInstruction(attrs: CallInstructionCompilerAttrs) {
  const { instruction, context } = attrs;

  const { labelsResolver, allocator } = context;
  const { fnPtr } = instruction;

  // handle normal call
  if (isIRLabel(fnPtr)) {
    if (fnPtr.isBuiltin()) {
      return compileBuiltinCallFn(attrs);
    } else {
      const labelResult = labelsResolver.getLabel(fnPtr.name);

      if (!isIRFnDeclInstruction(labelResult.instruction)) {
        throw new CBackendError(CBackendErrorCode.CALL_ON_NON_CALLABLE_TYPE);
      }

      const caller = getX86FnCaller(
        labelResult.instruction.type.callConvention,
      );

      return caller.compileIRFnCall({
        callerInstruction: instruction,
        declInstruction: labelResult.instruction,
        address: labelResult.asmLabel,
        context,
      });
    }
  }

  // handle pointer call
  if (isIRVariable(fnPtr)) {
    const nonPtrFnType = getSourceNonPtrType(fnPtr.type);

    if (!nonPtrFnType || !isFuncDeclLikeType(nonPtrFnType)) {
      throw new CBackendError(CBackendErrorCode.CALL_ON_NON_CALLABLE_TYPE);
    }

    const address = allocator.regs.tryResolveIrArg({
      arg: fnPtr,
    });

    const caller = getX86FnCaller(nonPtrFnType.callConvention);
    const declInstruction = new IRFnDeclInstruction(
      nonPtrFnType,
      '<anonymous>',
      nonPtrFnType.args.map(IRVariable.ofScopeVariable),
      nonPtrFnType.returnType,
    );

    // todo: RVO?
    return caller.compileIRFnCall({
      callerInstruction: instruction,
      declInstruction,
      address: address.value as string,
      context,
    });
  }

  throw new CBackendError(CBackendErrorCode.CALL_ON_NON_CALLABLE_TYPE);
}
