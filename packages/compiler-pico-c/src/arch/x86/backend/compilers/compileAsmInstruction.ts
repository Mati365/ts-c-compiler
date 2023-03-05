import { IRAsmInstruction } from '@compiler/pico-c/frontend/ir/instructions';
import { X86CompilerInstructionFnAttrs } from '../../constants/types';

type AsmInstructionCompilerAttrs =
  X86CompilerInstructionFnAttrs<IRAsmInstruction>;

export function compileAsmInstruction({
  instruction,
}: AsmInstructionCompilerAttrs): string[] {
  return [`# ${instruction.expression}`];
}
