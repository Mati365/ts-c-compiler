import { trimLines } from '@compiler/core/utils';
import { IRAsmInstruction } from '@compiler/pico-c/frontend/ir/instructions';

import { X86CompilerInstructionFnAttrs } from '../../../constants/types';
import { compileAsmClobbers } from './compileAsmClobbers';
import { compileAsmInputs } from './compileAsmInputs';
import { compileAsmOutputs } from './compileAsmOutputs';

type AsmInstructionCompilerAttrs =
  X86CompilerInstructionFnAttrs<IRAsmInstruction>;

export function compileAsmInstruction({
  context,
  instruction,
}: AsmInstructionCompilerAttrs): string[] {
  const { inputOperands, outputOperands, clobberOperands } = instruction;
  const asm: string[] = [];

  const inputResult = compileAsmInputs({
    interpolatedExpression: trimLines(instruction.expression),
    context,
    inputOperands,
  });

  const outputResult = compileAsmOutputs({
    interpolatedExpression: inputResult.interpolatedExpression,
    context,
    outputOperands,
  });

  const clobbersResult = compileAsmClobbers({
    context,
    clobberOperands,
  });

  asm.push(
    ...clobbersResult.pre,
    ...inputResult.asm,
    ...outputResult.asm.pre,
    outputResult.interpolatedExpression,
    ...outputResult.asm.post,
    ...clobbersResult.post,
  );

  return asm;
}
