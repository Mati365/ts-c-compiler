import { condFlag } from '@compiler/core/utils';
import {
  isIRConstant,
  isIRVariable,
} from '@compiler/pico-c/frontend/ir/variables';

import { X86RegName } from '@x86-toolkit/assembler/index';
import { IRAsmInputOperands } from '@compiler/pico-c/frontend/ir/instructions';
import { IRArgDynamicResolverType } from '../../reg-allocator';
import { X86CompilerFnAttrs } from '../../../constants/types';

type AsmInputCompilerAttrs = X86CompilerFnAttrs & {
  inputOperands: IRAsmInputOperands;
  interpolatedExpression: string;
};

export function compileAsmInputs({
  interpolatedExpression,
  inputOperands,
  context,
}: AsmInputCompilerAttrs) {
  const { allocator } = context;

  const asm: string[] = [];
  const allocatedRegs: X86RegName[] = [];

  for (const [symbolicName, value] of Object.entries(inputOperands)) {
    const replaceName = `%[${symbolicName}]`;
    const { irVar, constraint } = value;
    const { flags } = constraint;

    if (!interpolatedExpression.includes(replaceName)) {
      continue;
    }

    if (isIRVariable(irVar)) {
      const allocatorAllowTypes =
        condFlag(flags.register, IRArgDynamicResolverType.REG) |
        condFlag(flags.memory, IRArgDynamicResolverType.MEM);

      const resolvedVariable = allocator.regs.tryResolveIrArg({
        arg: irVar,
        allow: allocatorAllowTypes,
        noOwnership: true,
      });

      asm.push(...resolvedVariable.asm);
      interpolatedExpression = interpolatedExpression.replaceAll(
        replaceName,
        resolvedVariable.value as string,
      );

      if (resolvedVariable.type === IRArgDynamicResolverType.REG) {
        allocatedRegs.push(resolvedVariable.value);
      }
    } else if (isIRConstant(irVar)) {
      interpolatedExpression = interpolatedExpression.replaceAll(
        replaceName,
        irVar.constant.toString(),
      );
    }
  }

  allocator.regs.releaseRegs(allocatedRegs);

  return {
    asm,
    interpolatedExpression,
  };
}
