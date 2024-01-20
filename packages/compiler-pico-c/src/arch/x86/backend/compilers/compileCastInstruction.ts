import { IRCastInstruction } from 'frontend/ir/instructions';
import { CBackendError, CBackendErrorCode } from 'backend/errors/CBackendError';

import { genInstruction } from 'arch/x86/asm-utils';
import { isPrimitiveLikeType } from 'frontend/analyze';

import { X86CompilerInstructionFnAttrs } from '../../constants/types';
import { X86CompileInstructionOutput } from './shared';
import { IRArgDynamicResolverType } from '../reg-allocator';

type CastInstructionCompilerAttrs =
  X86CompilerInstructionFnAttrs<IRCastInstruction>;

export function compileCastInstruction({
  instruction,
  context,
}: CastInstructionCompilerAttrs) {
  const { allocator } = context;
  const { inputVar, outputVar } = instruction;
  const { memOwnership, regs, x87regs, stackFrame, lifetime, iterator } =
    allocator;

  const output = new X86CompileInstructionOutput();

  if (
    !isPrimitiveLikeType(inputVar.type) ||
    !isPrimitiveLikeType(outputVar.type)
  ) {
    throw new CBackendError(CBackendErrorCode.CANNOT_CAST_VARIABLES);
  }

  if (inputVar.type.isIntegral() && outputVar.type.isFloating()) {
    // int -> float
    const pushResult = x87regs.tryResolveIRArgAsReg({
      arg: inputVar,
      castedType: outputVar.type,
      allowCast: true,
    });

    output.appendGroup(pushResult.asm);
    x87regs.tracker.setOwnership({
      ...pushResult.entry,
      varName: outputVar.name,
    });
  } else if (inputVar.type.isFloating() && outputVar.type.isIntegral()) {
    // int -> float
    const spillVar = stackFrame.allocSpillVariable(
      outputVar.type.getByteSize(),
    );

    const spillMemAddr = stackFrame.getLocalVarStackRelAddress(spillVar.name, {
      withSize: true,
    });

    const pushResult = x87regs.tryResolveIRArgAsReg({
      arg: inputVar,
      stackTop: true,
    });

    const reg = regs.requestReg({
      size: outputVar.type.getByteSize(),
    });

    output.appendGroup(
      x87regs.storeStackRegAtAddress({
        reg: pushResult.entry.reg,
        address: spillMemAddr,
        integral: true,
        pop: !lifetime.isVariableLaterUsed(
          allocator.iterator.offset,
          spillVar.name,
        ),
      }).asm,
    );

    output.appendInstructions(
      ...reg.asm,
      genInstruction('mov', reg.value, spillMemAddr),
    );

    output.appendGroup(pushResult.asm);
    regs.ownership.setOwnership(outputVar.name, {
      reg: reg.value,
    });
  } else if (outputVar.type.getByteSize() - inputVar.type.getByteSize() === 1) {
    const rValue = regs.tryResolveIrArg({
      arg: inputVar,
    });

    if (
      rValue.type === IRArgDynamicResolverType.REG &&
      !lifetime.isVariableLaterUsed(iterator.offset, inputVar.name)
    ) {
      regs.ownership.dropOwnership(inputVar.name);
    }

    const extendedReg = regs.requestReg({
      size: outputVar.type.getByteSize(),
    });

    output.appendInstructions(
      ...rValue.asm,
      ...extendedReg.asm,
      genInstruction('movzx', extendedReg.value, rValue.value),
    );

    regs.ownership.setOwnership(outputVar.name, {
      reg: extendedReg.value,
    });
  } else {
    const inputMemOwnership = memOwnership.getVarOwnership(inputVar.name);

    if (inputMemOwnership) {
      memOwnership.aliasOwnership(inputVar.name, outputVar.name);
    } else {
      regs.ownership.aliasOwnership(inputVar.name, outputVar.name);
    }
  }

  return output;
}
