import {
  IRCallInstruction,
  IRFnDeclInstruction,
  isIRFnDeclInstruction,
} from 'frontend/ir/instructions';

import { CBackendError, CBackendErrorCode } from 'backend/errors/CBackendError';

import { getSourceNonPtrType } from 'frontend/analyze/types/utils';
import { IRVariable, isIRLabel, isIRVariable } from 'frontend/ir/variables';
import { isFuncDeclLikeType, isPrimitiveLikeType } from 'frontend/analyze';
import { genInstruction } from 'arch/x86/asm-utils';

import { X86CompilerInstructionFnAttrs } from '../../constants/types';
import { getX86FnCaller } from '../call-conventions';
import { compileBuiltinCallFn } from './builtin';
import { X86CompileInstructionOutput } from './shared';

type CallInstructionCompilerAttrs =
  X86CompilerInstructionFnAttrs<IRCallInstruction>;

export function compileCallInstruction(attrs: CallInstructionCompilerAttrs) {
  const { instruction, context } = attrs;
  const output = new X86CompileInstructionOutput();

  const { labelsResolver, allocator } = context;
  const { stackFrame, memOwnership } = allocator;
  const { fnPtr, outputVar } = instruction;

  // handle normal call
  if (isIRLabel(fnPtr)) {
    if (fnPtr.isBuiltin()) {
      output.appendGroup(compileBuiltinCallFn(attrs));
    } else {
      const labelResult = labelsResolver.getLabel(fnPtr.name);

      if (!isIRFnDeclInstruction(labelResult.instruction)) {
        throw new CBackendError(CBackendErrorCode.CALL_ON_NON_CALLABLE_TYPE);
      }

      const caller = getX86FnCaller(
        labelResult.instruction.type.callConvention,
      );

      output.appendGroup(
        caller.compileIRFnCall({
          callerInstruction: instruction,
          declInstruction: labelResult.instruction,
          address: labelResult.asmLabel,
          context,
        }),
      );
    }
  } else if (isIRVariable(fnPtr)) {
    // handle pointer call
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
    output.appendGroup(
      caller.compileIRFnCall({
        callerInstruction: instruction,
        declInstruction,
        address: address.value as string,
        context,
      }),
    );
  } else {
    throw new CBackendError(CBackendErrorCode.CALL_ON_NON_CALLABLE_TYPE);
  }

  // st0-st7 are cleared when function is called so force load it into mem every function call
  // todo: NOT NEEDED IF NEXT INSTRUCTION IS STORE
  if (
    isPrimitiveLikeType(outputVar?.type, true) &&
    outputVar.type.isFloating()
  ) {
    const stackVar = stackFrame.allocSpillVariable(
      outputVar.type.getByteSize(),
    );

    const memAddr = stackFrame.getLocalVarStackRelAddress(stackVar.name, {
      withSize: true,
    });

    // by default it is st0 register
    output.appendInstructions(genInstruction('fst', memAddr));
    memOwnership.setOwnership(outputVar.name, {
      stackVar,
    });
  }

  return output;
}
