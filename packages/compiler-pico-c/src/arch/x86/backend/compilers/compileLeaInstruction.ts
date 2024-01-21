import { CBackendError, CBackendErrorCode } from 'backend/errors/CBackendError';

import { CPrimitiveType } from 'frontend/analyze';
import { IRLeaInstruction } from 'frontend/ir/instructions';

import { X86CompilerInstructionFnAttrs } from '../../constants/types';
import {
  genInstruction,
  genLabelName,
  withInlineComment,
} from '../../asm-utils';

import { X86CompileInstructionOutput } from './shared';

type LeaInstructionCompilerAttrs =
  X86CompilerInstructionFnAttrs<IRLeaInstruction>;

export function compileLeaInstruction({
  instruction,
  context,
}: LeaInstructionCompilerAttrs) {
  const { inputVar, outputVar, meta } = instruction;
  const {
    allocator: { regs, config, stackFrame },
  } = context;

  const addressReg = meta.phi
    ? regs.tryResolveIRArgAsReg({
        arg: meta.phi?.vars[0] || outputVar,
        allocIfNotFound: true,
        preferRegs: regs.ownership.getAvailableRegs().addressing,
      })
    : regs.requestReg({
        size: CPrimitiveType.address(config.arch).getByteSize(),
        prefer: regs.ownership.getAvailableRegs().addressing,
      });

  regs.ownership.setOwnership(outputVar.name, {
    reg: addressReg.value,
    noPrune: !!meta.phi,
  });

  // variable allocated in data segment
  // such like: const char* str = "Hello world!";
  if (inputVar.constInitialized) {
    return X86CompileInstructionOutput.ofInstructions([
      ...addressReg.asm,
      withInlineComment(
        genInstruction('mov', addressReg.value, genLabelName(inputVar.name)),
        instruction.getDisplayName(),
      ),
    ]);
  }

  // int* a = &k;
  const stackAddress = stackFrame.getLocalVarStackRelAddress(inputVar.name);
  if (stackAddress) {
    return X86CompileInstructionOutput.ofInstructions([
      ...addressReg.asm,
      withInlineComment(
        genInstruction('lea', addressReg.value, stackAddress),
        instruction.getDisplayName(),
      ),
    ]);
  }

  throw new CBackendError(CBackendErrorCode.UNABLE_TO_COMPILE_INSTRUCTION);
}
