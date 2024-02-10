import { getByteSizeArgPrefixName } from '@ts-c-compiler/x86-assembler';

import type { IRVariable } from 'frontend/ir/variables';
import type { CType } from 'frontend/analyze';
import type { X86Allocator } from '../../X86Allocator';

import { genComment, genInstruction, genMemAddress } from 'arch/x86/asm-utils';

import { X86StackFrame } from '../../X86StackFrame';
import { X86CompileInstructionOutput } from './X86CompileInstructionOutput';
import { isLabelOwnership, isStackVarOwnership } from '../../reg-allocator/mem/ownership';

type StackMemcpyAttrs = {
  allocator: X86Allocator;
  type: CType;
  arg: IRVariable;
};

export function compileStackMemcpy({ allocator, type, arg }: StackMemcpyAttrs) {
  const { stackFrame } = allocator;
  const asm: string[] = [];

  // perform expensive struct memcpy
  // todo: maybe add smarter algorithm?
  const stackPtrSize = X86StackFrame.getStackAllocVariableSize(arg);
  const regOwnership = allocator.regOwnership.getVarOwnership(arg.name);
  const memOwnership = allocator.memOwnership.getVarOwnership(arg.name);

  asm.push(genComment(`Copy of struct - ${arg.getDisplayName()}`));

  for (
    let offset =
      Math.ceil(type.getByteSize() / stackPtrSize) * stackPtrSize - stackPtrSize;
    offset >= 0;
    offset -= stackPtrSize
  ) {
    if (regOwnership) {
      asm.push(genInstruction('push', regOwnership.reg));
    } else {
      let addr: string = null;

      if (isLabelOwnership(memOwnership)) {
        addr = genMemAddress({
          expression: memOwnership.asmLabel,
          offset,
        });
      } else if (stackFrame.isStackVar(arg.name)) {
        addr = stackFrame.getLocalVarStackRelAddress(arg.name, { offset });
      } else if (isStackVarOwnership(memOwnership)) {
        addr = stackFrame.getLocalVarStackRelAddress(memOwnership.stackVar.name, {
          offset,
        });
      }

      asm.push(
        genInstruction('push', `${getByteSizeArgPrefixName(stackPtrSize)} ${addr}`),
      );
    }
  }

  return X86CompileInstructionOutput.ofInstructions(asm);
}
