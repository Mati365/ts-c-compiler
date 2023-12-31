import { IRCallInstruction } from 'frontend/ir/instructions';
import { X86CompilerInstructionFnAttrs } from 'arch/x86/constants/types';
import { genComment, genInstruction, genMemAddress } from 'arch/x86/asm-utils';
import { isIRConstant, isIRVariable } from 'frontend/ir/variables';
import { X86CompileInstructionOutput } from '../../shared';

type BuiltinVaArgCallAttrs = X86CompilerInstructionFnAttrs<IRCallInstruction>;

/**
 * void va_arg ( va_list ap, int size );
 */
export const compileBuiltinVaArg = ({
  instruction,
  context,
}: BuiltinVaArgCallAttrs) => {
  const {
    allocator: { regs },
  } = context;

  const {
    args: [vaListPtrArg, sizeArg, destArg],
  } = instruction;

  const vaListPtr = regs.tryResolveIrArg({
    arg: vaListPtrArg,
  });

  const destPtr = regs.tryResolveIrArg({
    arg: destArg,
  });

  const vaPtrReg = regs.requestReg({
    size: 2,
    allowedRegs: regs.ownership.getAvailableRegs().addressing,
  });

  if (!isIRConstant(sizeArg)) {
    return X86CompileInstructionOutput.ofInstructions([]);
  }

  const loadedValReg = regs.requestReg({ size: sizeArg.constant });

  if (isIRVariable(vaListPtrArg)) {
    regs.ownership.dropOwnership(vaListPtrArg.name);
  }

  if (isIRVariable(destArg)) {
    regs.ownership.dropOwnership(destArg.name);
  }

  regs.releaseRegs([vaPtrReg.value, loadedValReg.value]);

  return X86CompileInstructionOutput.ofInstructions([
    ...vaListPtr.asm,
    ...vaPtrReg.asm,
    ...loadedValReg.asm,
    genComment(`VA arg getter - start - ${sizeArg.constant}B`),
    genInstruction(
      'mov',
      vaPtrReg.value,
      genMemAddress({ expression: vaListPtr.value as string }),
    ),
    genInstruction('add', vaPtrReg.value, vaListPtrArg.type.getByteSize()),
    genInstruction(
      'mov',
      loadedValReg.value,
      genMemAddress({
        expression: vaPtrReg.value as string,
      }),
    ),
    genInstruction(
      'mov',
      genMemAddress({ expression: destPtr.value as string }),
      loadedValReg.value,
    ),
    genInstruction(
      'mov',
      genMemAddress({ expression: vaListPtr.value as string }),
      vaPtrReg.value,
    ),
    genComment('VA arg getter - end'),
  ]);
};
