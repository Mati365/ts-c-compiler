import { trimLines } from '@ts-c-compiler/core';
import { IRAsmInstruction } from 'frontend/ir/instructions';

import { X86CompilerInstructionFnAttrs } from '../../../constants/types';
import { compileAsmClobbers } from './compileAsmClobbers';
import { compileAsmInputs } from './compileAsmInputs';
import { compileAsmOutputs } from './compileAsmOutputs';
import { X86CompileInstructionOutput } from '../shared';

type AsmInstructionCompilerAttrs = X86CompilerInstructionFnAttrs<IRAsmInstruction>;

export function compileAsmInstruction({
  context,
  instruction,
}: AsmInstructionCompilerAttrs) {
  const { allocator } = context;
  const { inputOperands, outputOperands, clobberOperands } = instruction;

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

  allocator.regs.releaseRegs([
    ...inputResult.allocatedRegs,
    ...outputResult.allocatedRegs,
  ]);

  return new X86CompileInstructionOutput([
    ...inputResult.asm,
    ...outputResult.asm.pre,
    ...clobbersResult.pre,
    outputResult.interpolatedExpression,
    ...clobbersResult.post,
    ...outputResult.asm.post,
  ]);
}
