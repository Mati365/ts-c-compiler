import {IRFnDeclInstruction} from '@compiler/pico-c/frontend/ir/instructions';
import {CompilerFnAttrs} from '../../constants/types';

type FnDeclCompilerAttrs = CompilerFnAttrs & {
  instruction: IRFnDeclInstruction;
};

export function compileFnDeclInstruction(
  {
    instruction,
    context,
  }: FnDeclCompilerAttrs,
): string[] {
  const {allocator} = context;
  const asm: string[] = [
    allocator.allocLabelInstruction('fn', instruction.name),
    ...allocator.allocStackFrameInstructions(
      () => [
      ],
    ),
  ];

  console.info(instruction);

  return asm;
}
