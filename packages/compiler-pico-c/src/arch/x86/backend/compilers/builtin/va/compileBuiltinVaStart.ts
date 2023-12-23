import { genInstruction, genMemAddress } from 'arch/x86/asm-utils';
import { IRCallInstruction } from 'frontend/ir/instructions';

import { X86CompilerInstructionFnAttrs } from 'arch/x86/constants/types';
import { isIRVariable } from 'frontend/ir/variables';

type BuiltinVaStartCallAttrs = X86CompilerInstructionFnAttrs<IRCallInstruction>;

/**
 * void va_start( va_list ap, parmN );
 */
export const compileBuiltinVaStart = ({
  instruction,
  context,
}: BuiltinVaStartCallAttrs) => {
  const { allocator } = context;
  const {
    args: [vaListPtrArg, outputArg],
  } = instruction;

  const vaListPtr = allocator.regs.tryResolveIrArg({
    arg: vaListPtrArg,
  });

  const lastArgPtr = allocator.regs.tryResolveIrArg({
    arg: outputArg,
  });

  if (isIRVariable(vaListPtrArg)) {
    allocator.regs.ownership.dropOwnership(vaListPtrArg.name);
  }

  if (isIRVariable(outputArg)) {
    allocator.regs.ownership.dropOwnership(outputArg.name);
  }

  return [
    ...vaListPtr.asm,
    ...lastArgPtr.asm,
    genInstruction(
      'mov',
      genMemAddress({ expression: vaListPtr.value as string }),
      lastArgPtr.value,
    ),
  ];
};
