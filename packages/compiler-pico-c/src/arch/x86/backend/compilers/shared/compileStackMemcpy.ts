import { getByteSizeArgPrefixName } from '@ts-c-compiler/x86-assembler';

import type { IRVariable } from 'frontend/ir/variables';
import type { CType } from 'frontend/analyze';
import type { X86Allocator } from '../../X86Allocator';

import { genComment, genInstruction, genMemAddress } from 'arch/x86/asm-utils';
import { isLabelOwnership } from '../../reg-allocator/utils';

import { X86StackFrame } from '../../X86StackFrame';
import { X86RegOwnershipTracker } from '../../reg-allocator';

type StackMemcpyAttrs = {
  ownership: X86RegOwnershipTracker;
  allocator: X86Allocator;
  type: CType;
  arg: IRVariable;
};

export function compileStackMemcpy({
  ownership,
  allocator,
  type,
  arg,
}: StackMemcpyAttrs) {
  const { stackFrame } = allocator;
  const asm: string[] = [];

  // perform expensive struct memcpy
  // todo: maybe add smarter algorithm?
  const stackPtrSize = X86StackFrame.getStackAllocVariableSize(arg);
  const argOwnership = ownership.getVarOwnership(arg.name);

  asm.push(genComment(`Copy of struct - ${arg.getDisplayName()}`));

  for (
    let offset =
      Math.ceil(type.getByteSize() / stackPtrSize) * stackPtrSize -
      stackPtrSize;
    offset >= 0;
    offset -= stackPtrSize
  ) {
    let addr: string = null;

    if (isLabelOwnership(argOwnership)) {
      addr = genMemAddress({
        expression: argOwnership.asmLabel,
        offset,
      });
    } else {
      addr = stackFrame.getLocalVarStackRelAddress(arg.name, offset);
    }

    asm.push(
      genInstruction(
        'push',
        `${getByteSizeArgPrefixName(stackPtrSize)} ${addr}`,
      ),
    );
  }

  return asm;
}
