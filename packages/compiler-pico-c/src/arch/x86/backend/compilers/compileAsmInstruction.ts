import { condFlag, trimLines } from '@compiler/core/utils';
import { IRAsmInstruction } from '@compiler/pico-c/frontend/ir/instructions';

import { X86CompilerInstructionFnAttrs } from '../../constants/types';
import { IRArgDynamicResolverType } from '../reg-allocator';

type AsmInstructionCompilerAttrs =
  X86CompilerInstructionFnAttrs<IRAsmInstruction>;

export function compileAsmInstruction({
  context,
  instruction,
}: AsmInstructionCompilerAttrs): string[] {
  const { allocator } = context;
  const { inputOperands } = instruction;
  const asm: string[] = [];

  let interpolatedExpression = trimLines(instruction.expression);

  for (const [symbolicName, value] of Object.entries(inputOperands)) {
    const replaceName = `%[${symbolicName}]`;
    if (!interpolatedExpression.includes(replaceName)) {
      continue;
    }

    const allocatorAllowTypes =
      condFlag(value.constraint.flags.register, IRArgDynamicResolverType.REG) |
      condFlag(value.constraint.flags.memory, IRArgDynamicResolverType.MEM);

    const resolvedVariable = allocator.regs.tryResolveIrArg({
      arg: value.irVar,
      allow: allocatorAllowTypes,
      noOwnership: true,
    });

    asm.push(...resolvedVariable.asm);
    interpolatedExpression = interpolatedExpression.replaceAll(
      replaceName,
      resolvedVariable.value as string,
    );
  }

  asm.push(interpolatedExpression);
  return asm;
}
