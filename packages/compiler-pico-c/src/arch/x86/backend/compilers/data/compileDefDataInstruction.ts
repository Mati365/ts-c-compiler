import { isPointerLikeType } from '@compiler/pico-c/frontend/analyze';

import type { IRDefDataInstruction } from '@compiler/pico-c/frontend/ir/instructions';
import type { X86LabelsResolver } from '../../X86LabelsResolver';
import { genDefConst } from '../../../asm-utils';

type DefInstructionCompilerAttrs = {
  instruction: IRDefDataInstruction;
  labelsResolver: X86LabelsResolver;
};

export function compileDefDataInstruction({
  instruction,
  labelsResolver,
}: DefInstructionCompilerAttrs): string[] {
  const defConst = instruction as IRDefDataInstruction;
  const { asmLabel } = labelsResolver.createAndPutLabel({
    name: defConst.outputVar.name,
    type: defConst.outputVar.type,
    instruction: defConst,
  });

  const { initializer, outputVar } = defConst;

  const dataLiteral = (() => {
    if (
      initializer.isNonArrayInitializer() &&
      isPointerLikeType(initializer.baseType)
    ) {
      return genDefConst(
        initializer.baseType.getByteSize(),
        defConst.initializer.fields as number[],
      );
    }

    return genDefConst(
      defConst.initializer.getSingleItemByteSize(),
      defConst.initializer.fields as number[],
    );
  })();

  if (outputVar.virtualArrayPtr) {
    const strStringLabel = `${asmLabel}@allocated`;

    return [
      `${strStringLabel}: ${dataLiteral}`,
      `${asmLabel}: ${genDefConst(outputVar.type.getByteSize(), [
        strStringLabel,
      ])}`,
    ];
  }

  return [`${asmLabel}: ${dataLiteral}`];
}
