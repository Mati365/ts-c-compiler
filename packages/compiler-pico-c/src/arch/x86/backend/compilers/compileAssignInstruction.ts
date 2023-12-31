import { IRAssignInstruction } from 'frontend/ir/instructions';
import { X86CompilerInstructionFnAttrs } from '../../constants/types';
import { X86CompileInstructionOutput } from './shared';

import { genInstruction, withInlineComment } from '../../asm-utils';
import { isIRConstant } from 'frontend/ir/variables';

type AssignInstructionCompilerAttrs =
  X86CompilerInstructionFnAttrs<IRAssignInstruction>;

export function compileAssignInstruction({
  instruction,
  context,
}: AssignInstructionCompilerAttrs) {
  const { allocator } = context;
  const { inputVar, outputVar, meta } = instruction;
  const { regs } = allocator;

  const outputReg = regs.tryResolveIRArgAsReg({
    arg: meta.phi?.vars[0] || outputVar,
    allocIfNotFound: true,
    ...(meta?.preferAddressRegsOutput && {
      preferRegs: allocator.regs.ownership.getAvailableRegs().addressing,
    }),
  });

  regs.ownership.setOwnership(outputVar.name, {
    reg: outputReg.value,
    noPrune: !!meta.phi,
  });

  // replace mov ax, 0 with xor ax, ax
  if (isIRConstant(inputVar) && inputVar.constant === 0x0) {
    return X86CompileInstructionOutput.ofInstructions([
      ...outputReg.asm,
      withInlineComment(
        genInstruction('xor', outputReg.value, outputReg.value),
        instruction.getDisplayName(),
      ),
    ]);
  }

  const inputArg = regs.tryResolveIrArg({
    arg: inputVar,
  });

  return X86CompileInstructionOutput.ofInstructions([
    ...outputReg.asm,
    ...inputArg.asm,
    withInlineComment(
      genInstruction('mov', outputReg.value, inputArg.value),
      instruction.getDisplayName(),
    ),
  ]);
}
