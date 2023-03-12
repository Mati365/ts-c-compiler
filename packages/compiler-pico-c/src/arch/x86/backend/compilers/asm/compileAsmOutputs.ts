import { condFlag } from '@compiler/core/utils';
import { isIRVariable } from '@compiler/pico-c/frontend/ir/variables';

import { X86RegName } from '@x86-toolkit/assembler/index';
import { IRAsmOutputOperands } from '@compiler/pico-c/frontend/ir/instructions';
import { IRArgDynamicResolverType } from '../../reg-allocator';
import { X86CompilerFnAttrs } from '../../../constants/types';
import { genInstruction } from '../../../asm-utils';

export type AsmOutputsWrapperAsm = { pre: string[]; post: string[] };

type AsmOutputCompilerAttrs = X86CompilerFnAttrs & {
  outputOperands: IRAsmOutputOperands;
  interpolatedExpression: string;
};

export function compileAsmOutputs({
  interpolatedExpression,
  outputOperands,
  context,
}: AsmOutputCompilerAttrs) {
  const { allocator } = context;

  const asm: AsmOutputsWrapperAsm = { pre: [], post: [] };
  const allocatedRegs: X86RegName[] = [];

  for (const [symbolicName, value] of Object.entries(outputOperands)) {
    const replaceName = `%[${symbolicName}]`;
    const { irVar, constraint } = value;
    const { flags } = constraint;

    if (!interpolatedExpression.includes(replaceName) || !isIRVariable(irVar)) {
      continue;
    }

    if (condFlag(flags.memory, IRArgDynamicResolverType.MEM)) {
      const memResult = allocator.regs.tryResolveIRArgAsAddr(irVar);

      if (memResult) {
        asm.pre.push(...memResult.asm);
        interpolatedExpression = interpolatedExpression.replaceAll(
          replaceName,
          memResult.value,
        );

        continue;
      }
    }

    if (condFlag(flags.register, IRArgDynamicResolverType.REG)) {
      const regResult = allocator.regs.tryResolveIRArgAsReg({
        arg: irVar,
        allocIfNotFound: true,
      });

      if (regResult) {
        interpolatedExpression = interpolatedExpression.replaceAll(
          replaceName,
          regResult.value as string,
        );

        asm.pre.push(...regResult.asm);

        if (!irVar.isTemporary()) {
          asm.post.push(
            genInstruction(
              'mov',
              allocator.stackFrame.getLocalVarStackRelAddress(irVar.name),
              regResult.value,
            ),
          );

          allocatedRegs.push(regResult.value);
        }

        continue;
      }
    }
  }

  allocator.regs.releaseRegs(allocatedRegs);

  return {
    asm,
    interpolatedExpression,
  };
}
