import { IRInstructionTypedArg, isIRVariable } from 'frontend/ir/variables';

import { genInstruction, withInlineComment } from '../../../../asm-utils';

import { X86BackendCompilerContext } from '../../../../constants/types';
import { IRRegReqResult } from '../../../reg-allocator';
import { X86CompileInstructionOutput } from '../../shared';

type OverrideCheckAttrs = {
  leftVar: IRInstructionTypedArg;
  leftAllocResult: IRRegReqResult;
  context: X86BackendCompilerContext;
};

/**
 * add ax, 1 moves its output to `ax` as a dest
 * but IR code looks like this: %t{1}: int2B = %t{0}: int2B plus %1: int2B
 * it means that if `%t{0}` is being overridden after performing operation
 * in 90% of cases it will not create any problems but there is `++i` and `i++`
 * statements. The second one returns `%t{0}` which is being overridden.
 * so we have to perform lookup ahead if something is using `%t{0}`.
 * if not - do not add any additional instructions
 * if so - generate additional mov
 * see: look at compileMathSingleInstruction()
 */
export const ensureFunctionNotOverridesOutput = ({
  leftVar,
  leftAllocResult,
  context,
}: OverrideCheckAttrs) => {
  const asm: string[] = [];
  const {
    iterator,
    allocator: { regs },
  } = context;

  if (
    isIRVariable(leftVar) &&
    regs.ownership.lifetime.isVariableLaterUsed(iterator.offset, leftVar.name)
  ) {
    const reg = regs.requestReg({
      size: leftVar.type.getByteSize(),
    });

    asm.push(
      ...reg.asm,
      withInlineComment(genInstruction('mov', reg.value, leftAllocResult.value), 'swap'),
    );

    regs.ownership.setOwnership(leftVar.name, {
      releasePrevAllocatedReg: false,
      reg: reg.value,
    });
  }

  return X86CompileInstructionOutput.ofInstructions(asm);
};
