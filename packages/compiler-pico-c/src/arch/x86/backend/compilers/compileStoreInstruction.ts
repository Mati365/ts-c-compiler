import { IRStoreInstruction } from '@compiler/pico-c/frontend/ir/instructions';
import { getByteSizeArgPrefixName } from '@x86-toolkit/assembler/parser/utils';

import { CompilerFnAttrs } from '../../constants/types';
import { IRArgResolverType } from '../X86AbstractRegAllocator';
import { genInstruction, withInlineComment } from '../../asm-utils';

type StoreInstructionCompilerAttrs = CompilerFnAttrs & {
  instruction: IRStoreInstruction;
};

export function compileStoreInstruction({
  iterator,
  instruction,
  context,
}: StoreInstructionCompilerAttrs): string[] {
  const { allocator } = context;
  const { outputVar, value } = instruction;
  const { stackFrame } = allocator;

  const prefix = getByteSizeArgPrefixName(value.type.getByteSize());
  const addr = stackFrame.getLocalVarStackRelAddress(outputVar.name);
  const rightAllocResult = allocator.regs.resolveIRArg({
    allow: IRArgResolverType.REG | IRArgResolverType.NUMBER,
    arg: value,
    iterator,
  });

  return [
    ...rightAllocResult.asm,
    withInlineComment(
      genInstruction(
        'mov',
        `${prefix.toLocaleLowerCase()} ${addr}`,
        rightAllocResult.value,
      ),
      instruction.getDisplayName(),
    ),
  ];
}
