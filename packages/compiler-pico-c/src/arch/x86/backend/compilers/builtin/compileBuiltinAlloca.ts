import { IRCallInstruction } from 'frontend/ir/instructions';
import { X86CompilerInstructionFnAttrs } from 'arch/x86/constants/types';
import { genInstruction } from 'arch/x86/asm-utils';
import { isIRVariable } from 'frontend/ir/variables';
import { X86CompileInstructionOutput } from '../shared';

type BuiltinAllocaCallAttrs = X86CompilerInstructionFnAttrs<IRCallInstruction>;

/**
 * char* alloca (unsigned int bytes);
 */
export const compileBuiltinAlloca = ({
  instruction,
  context,
}: BuiltinAllocaCallAttrs) => {
  const {
    allocator: { regs },
  } = context;

  const {
    args: [sizeArg],
    outputVar,
  } = instruction;

  const outputReg = regs.requestReg({
    size: 2,
  });

  const size = regs.tryResolveIrArg({
    arg: sizeArg,
  });

  regs.ownership.setOwnership(outputVar.name, {
    reg: outputReg.value,
  });

  if (isIRVariable(sizeArg)) {
    regs.ownership.dropOwnership(sizeArg.name);
  }

  return X86CompileInstructionOutput.ofInstructions([
    ...outputReg.asm,
    ...size.asm,
    genInstruction('sub', 'sp', size.value),
    genInstruction('mov', outputReg.value, 'sp'),
  ]);
};
