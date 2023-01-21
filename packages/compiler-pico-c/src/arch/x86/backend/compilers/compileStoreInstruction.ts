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
  const destAttr = [
    prefix.toLocaleLowerCase(),
    stackFrame.getLocalVarStackRelAddress(
      outputVar.name,
      outputVar.getStackAllocByteSize() - itemByteSize - offset,
    ),
  ].join(' ');

  if (isIRVariable(value)) {
    let inputReg = regs.tryResolveIRArgAsReg({
      arg: value,
    });

    if (inputReg) {
      regs.transferRegOwnership(outputVar.name, inputReg.value);
    } else {
      throw new CBackendError(CBackendErrorCode.STORE_VAR_ERROR);
    }

    return [
      ...inputReg.asm,
      withInlineComment(
        genInstruction('mov', destAttr, inputReg.value),
        instruction.getDisplayName(),
      ),
    ];
  }

  if (isIRConstant(value)) {
    return [
      withInlineComment(
        genInstruction('mov', destAttr, value.constant),
        instruction.getDisplayName(),
      ),
    ];
  }

  throw new CBackendError(CBackendErrorCode.STORE_VAR_ERROR);
}
