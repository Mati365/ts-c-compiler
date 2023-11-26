import { getByteSizeArgPrefixName } from '@ts-c-compiler/x86-assembler';

import type { IRVariable } from 'frontend/ir/variables';
import type { CType } from 'frontend/analyze';
import type { X86Allocator } from '../../X86Allocator';

import { genComment, genInstruction } from 'arch/x86/asm-utils';
import { X86StackFrame } from '../../X86StackFrame';

export function compileStackMemcpy(
  allocator: X86Allocator,
  type: CType,
  arg: IRVariable,
) {
  const asm: string[] = [];

  // perform expensive struct memcpy
  // todo: maybe add smarter algorithm?
  const stackPtrSize = X86StackFrame.getStackAllocVariableSize(arg);

  asm.push(genComment(`Copy of struct - ${arg.getDisplayName()}`));

  for (let offset = 0; offset < type.getByteSize(); offset += stackPtrSize) {
    const addr = allocator.stackFrame.getLocalVarStackRelAddress(
      arg.name,
      offset,
    );

    asm.push(
      genInstruction(
        'push',
        `${getByteSizeArgPrefixName(stackPtrSize)} ${addr}`,
      ),
    );
  }

  return asm;
}
