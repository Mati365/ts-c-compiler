import type { IRDefDataInstruction } from '@compiler/pico-c/frontend/ir/instructions';
import { genDefConst, genLabel } from '../../../asm-utils';

type DefInstructionCompilerAttrs = {
  instruction: IRDefDataInstruction;
};

export function compileDefDataInstruction({
  instruction,
}: DefInstructionCompilerAttrs): string[] {
  const defConst = instruction as IRDefDataInstruction;

  return [
    `${genLabel(defConst.outputVar.name)} ${genDefConst(
      'db',
      defConst.initializer.fields as number[],
    )}`,
  ];
}
