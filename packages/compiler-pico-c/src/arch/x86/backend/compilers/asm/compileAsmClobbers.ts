import type { IRAsmClobberOperand } from '@compiler/pico-c/frontend/ir/instructions';
import type { X86RegName } from '@x86-toolkit/cpu/parts';

import { genInstruction } from '../../../asm-utils';
import { getX86RegByteSize } from '../../../constants/regs';

import { X86CompilerFnAttrs } from '../../../constants/types';
import { AsmOutputsWrapperAsm } from './compileAsmOutputs';

type AsmClobbersCompilerAttrs = X86CompilerFnAttrs & {
  clobberOperands: IRAsmClobberOperand[];
};

export function compileAsmClobbers({
  context,
  clobberOperands,
}: AsmClobbersCompilerAttrs) {
  const { allocator } = context;
  const { regs } = allocator;
  const { ownership } = regs;

  const asm: AsmOutputsWrapperAsm = { pre: [], post: [] };

  clobberOperands.forEach(reg => {
    const regOwnership = ownership.getOwnershipByReg(reg as X86RegName);
    if (!regOwnership.length) {
      return;
    }

    const regSize = getX86RegByteSize(reg as X86RegName);
    const availableAltReg = regs.checkIfRegIsAvailable({
      size: regSize,
    });

    if (availableAltReg) {
      const swappedReg = regs.requestReg({
        size: regSize,
      });

      asm.pre.push(genInstruction('xchg', reg, swappedReg.value));
      regOwnership.forEach(varOwnership => {
        ownership.setOwnership(varOwnership, { reg: swappedReg.value });
      });
    } else {
      asm.pre.push(genInstruction('push', reg));
      asm.post.push(genInstruction('pop', reg));
    }
  });

  return asm;
}
