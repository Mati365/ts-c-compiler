import {
  CBackendError,
  CBackendErrorCode,
} from '@compiler/pico-c/backend/errors/CBackendError';

import { getByteSizeArgPrefixName } from '@x86-toolkit/assembler/parser/utils';
import { getSourceNonPtrType } from '@compiler/pico-c/frontend/analyze/types/utils';

import { IRStoreInstruction } from '@compiler/pico-c/frontend/ir/instructions';

import {
  isIRConstant,
  isIRVariable,
} from '@compiler/pico-c/frontend/ir/variables';

import {
  X86RegsParts,
  X86_ADDRESSING_REGS,
  X86_GENERAL_REGS_PARTS,
} from '../../constants/regs';

import { CompilerInstructionFnAttrs } from '../../constants/types';
import {
  genInstruction,
  genMemAddress,
  withInlineComment,
} from '../../asm-utils';

type StoreInstructionCompilerAttrs =
  CompilerInstructionFnAttrs<IRStoreInstruction>;

export function compileStoreInstruction({
  instruction,
  context,
}: StoreInstructionCompilerAttrs): string[] {
  const { allocator } = context;
  const { outputVar, value, offset } = instruction;
  const { stackFrame, regs } = allocator;

  let destAddr: { expr: string; size: number } = null;
  const asm: string[] = [];

  if (outputVar.isTemporary()) {
    // handle pointers assign
    // *(%t{0}) = 4;
    const outputByteSize = getSourceNonPtrType(outputVar.type).getByteSize();
    const ptrVarReg = regs.tryResolveIRArgAsReg({
      arg: outputVar,
      allowedRegs: X86_ADDRESSING_REGS,
    });

    asm.push(...ptrVarReg.asm);
    destAddr = {
      size: outputByteSize,
      expr: genMemAddress({
        size: getByteSizeArgPrefixName(outputByteSize),
        expression: ptrVarReg.value,
        offset,
      }),
    };
  } else {
    // handle normal variable assign
    // a = 5;
    const size = value.type.getByteSize();
    const prefix = getByteSizeArgPrefixName(size);

    destAddr = {
      size,
      expr: [
        prefix.toLocaleLowerCase(),
        stackFrame.getLocalVarStackRelAddress(outputVar.name, offset),
      ].join(' '),
    };
  }

  if (isIRVariable(value)) {
    let inputReg = regs.tryResolveIRArgAsReg({
      arg: value,
    });

    // case: *(%t{1}: char*2B) = store %t{2}: int2B
    // bigger value is loaded in smaller address
    if (inputReg.size - destAddr.size === 1) {
      const part = X86_GENERAL_REGS_PARTS[inputReg.value] as X86RegsParts;

      inputReg = {
        ...inputReg,
        size: part.size,
        value: part.low,
      };
    }

    asm.push(
      ...inputReg.asm,
      withInlineComment(
        genInstruction('mov', destAddr.expr, inputReg.value),
        instruction.getDisplayName(),
      ),
    );
  } else if (isIRConstant(value)) {
    asm.push(
      withInlineComment(
        genInstruction('mov', destAddr.expr, value.constant),
        instruction.getDisplayName(),
      ),
    );
  }

  if (!asm.length) {
    throw new CBackendError(CBackendErrorCode.STORE_VAR_ERROR);
  }

  return asm;
}
