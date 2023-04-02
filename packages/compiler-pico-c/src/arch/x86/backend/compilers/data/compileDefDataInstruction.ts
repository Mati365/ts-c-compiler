import type { CCompilerArch } from '@compiler/pico-c/constants';
import type { IRDefDataInstruction } from '@compiler/pico-c/frontend/ir/instructions';
import type { X86LabelsResolver } from '../../X86LabelsResolver';

import { compileArrayInitializerDefAsm } from './compileArrayInitializerDef';

type DefInstructionCompilerAttrs = {
  arch: CCompilerArch;
  instruction: IRDefDataInstruction;
  labelsResolver: X86LabelsResolver;
};

export function compileDefDataInstruction({
  arch,
  instruction,
  labelsResolver,
}: DefInstructionCompilerAttrs): string[] {
  const { initializer, outputVar, meta } = instruction;
  const { asmLabel } = labelsResolver.createAndPutLabel({
    name: outputVar.name,
    type: outputVar.type,
    instruction: instruction,
  });

  return compileArrayInitializerDefAsm({
    arch,
    asmLabel,
    initializer,
    emitItemLabels: !meta.virtualLocalArrayPtr,
  });
}
