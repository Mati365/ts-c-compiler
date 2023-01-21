import { CPrimitiveType } from '@compiler/pico-c/frontend/analyze';
import {
  CBackendError,
  CBackendErrorCode,
} from '@compiler/pico-c/backend/errors/CBackendError';

import { IRStoreInstruction } from '@compiler/pico-c/frontend/ir/instructions';
import { getByteSizeArgPrefixName } from '@x86-toolkit/assembler/parser/utils';

import { CompilerFnAttrs } from '../../constants/types';
import { genInstruction, withInlineComment } from '../../asm-utils';
import {
  isIRConstant,
  isIRVariable,
} from '@compiler/pico-c/frontend/ir/variables';

type StoreInstructionCompilerAttrs = CompilerFnAttrs & {
  instruction: IRStoreInstruction;
};

export function compileStoreInstruction({
  instruction,
  context,
}: StoreInstructionCompilerAttrs): string[] {
  const { allocator } = context;
  const { outputVar, value, offset } = instruction;
  const { stackFrame, regs } = allocator;

  const itemByteSize = value.type.getByteSize();
  const prefix = getByteSizeArgPrefixName(itemByteSize);

  let destAddr: string = null;
  const asm: string[] = [];

  if (outputVar.isTemporary()) {
    // handle pointers assign
    // *(%t{0}) = 4;
    const ptrByteSize = CPrimitiveType.address(
      allocator.config.arch,
    ).getByteSize();

    const ptrVarReg = regs.tryResolveIRArgAsReg({
      arg: outputVar,
      specificReg: 'bx',
    });

    asm.push(...ptrVarReg.asm);
    destAddr = `${getByteSizeArgPrefixName(ptrByteSize)} [${ptrVarReg.value}]`;
  } else {
    // handle normal variable assign
    // a = 5;
    destAddr = [
      prefix.toLocaleLowerCase(),
      stackFrame.getLocalVarStackRelAddress(
        outputVar.name,
        outputVar.getStackAllocByteSize() - itemByteSize - offset,
      ),
    ].join(' ');
  }

  if (isIRVariable(value)) {
    const inputReg = regs.tryResolveIRArgAsReg({
      arg: value,
    });

    asm.push(
      ...inputReg.asm,
      withInlineComment(
        genInstruction('mov', destAddr, inputReg.value),
        instruction.getDisplayName(),
      ),
    );
  }

  if (isIRConstant(value)) {
    asm.push(
      withInlineComment(
        genInstruction('mov', destAddr, value.constant),
        instruction.getDisplayName(),
      ),
    );
  }

  if (!asm.length) {
    throw new CBackendError(CBackendErrorCode.STORE_VAR_ERROR);
  }

  return asm;
}
