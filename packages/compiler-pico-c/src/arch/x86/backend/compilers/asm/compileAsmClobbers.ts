import chalk from 'chalk';
import * as R from 'ramda';

import type { X86RegName } from '@ts-c-compiler/x86-assembler';
import type { IRAsmClobberOperand } from 'frontend/ir/instructions';

import { genInstruction, withInlineComment } from '../../../asm-utils';
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

  const asm: AsmOutputsWrapperAsm = {
    pre: [],
    post: [],
  };

  clobberOperands.forEach(reg => {
    const regOwnership = ownership
      .getOwnershipByReg(reg as X86RegName, true)
      .filter(varName =>
        ownership.lifetime.isVariableLaterUsed(allocator.iterator.offset, varName),
      );

    if (!regOwnership.length) {
      return;
    }

    const withClobberComment = (line: string) =>
      withInlineComment(line, `${chalk.greenBright('clobber')} - ${reg}`);

    const clobberedSpecifiedRegSize = getX86RegByteSize(reg as X86RegName);
    const ownershipHasDifferentRegLength = regOwnership.some(varName => {
      const varOwnership = ownership.getVarOwnership(varName);

      return getX86RegByteSize(varOwnership.reg) !== clobberedSpecifiedRegSize;
    });

    // this condition exists due to edge case in clobber for partial regs
    // for example: we have variable `int k` stored in `ax` but we specified
    // that: `al` register is clobbered. We have to detect that case and if
    // it happens perform `push`/ `pop` rather than `mov`
    if (ownershipHasDifferentRegLength) {
      const preservedRegs = R.uniq(
        regOwnership.flatMap(varName => {
          const varOwnership = ownership.getVarOwnership(varName);

          return varOwnership ? [varOwnership.reg] : [];
        }),
      );

      for (const preservedReg of preservedRegs) {
        asm.pre.push(withClobberComment(genInstruction('push', preservedReg)));
        asm.post.unshift(withClobberComment(genInstruction('pop', preservedReg)));
      }
    } else {
      const availableAltReg = regs.checkIfRegIsAvailable({
        size: clobberedSpecifiedRegSize,
      });

      if (availableAltReg) {
        const swappedReg = regs.requestReg({
          size: clobberedSpecifiedRegSize,
        });

        asm.pre.push(withClobberComment(genInstruction('mov', swappedReg.value, reg)));

        regs.releaseRegs([reg as X86RegName]);
        regOwnership.forEach(varOwnership => {
          ownership.setOwnership(varOwnership, {
            reg: swappedReg.value,
          });
        });
      } else {
        asm.pre.push(withClobberComment(genInstruction('push', reg)));
        asm.post.unshift(withClobberComment(genInstruction('pop', reg)));
      }
    }
  });

  return asm;
}
