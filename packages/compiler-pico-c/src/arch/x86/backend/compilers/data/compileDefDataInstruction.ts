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
  const defConst = instruction as IRDefDataInstruction;
  const { asmLabel } = labelsResolver.createAndPutLabel({
    name: defConst.outputVar.name,
    type: defConst.outputVar.type,
    instruction: defConst,
  });

  const { initializer } = defConst;

  return compileArrayInitializerDefAsm({
    arch,
    asmLabel,
    initializer,
  });
}
