import { IRAssignInstruction } from '@compiler/pico-c/frontend/ir/instructions';
import { X86CompilerInstructionFnAttrs } from '../../constants/types';
import { genInstruction, withInlineComment } from '../../asm-utils';
import { isIRConstant } from '@compiler/pico-c/frontend/ir/variables';

type AssignInstructionCompilerAttrs =
  X86CompilerInstructionFnAttrs<IRAssignInstruction>;

export function compileAssignInstruction({
  instruction,
  context,
}: AssignInstructionCompilerAttrs): string[] {
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
    return [
      ...outputReg.asm,
      withInlineComment(
        genInstruction('xor', outputReg.value, outputReg.value),
        instruction.getDisplayName(),
      ),
    ];
  }

  const inputArg = regs.tryResolveIrArg({
    arg: inputVar,
  });

  return [
    ...outputReg.asm,
    ...inputArg.asm,
    withInlineComment(
      genInstruction('mov', outputReg.value, inputArg.value),
      instruction.getDisplayName(),
    ),
  ];
}
