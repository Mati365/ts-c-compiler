import { CPrimitiveType } from '@compiler/pico-c/frontend/analyze';
import {
  CBackendError,
  CBackendErrorCode,
} from '@compiler/pico-c/backend/errors/CBackendError';

import { X86_ADDRESSING_REGS } from '../../constants/regs';

import { IRStoreInstruction } from '@compiler/pico-c/frontend/ir/instructions';
import { getByteSizeArgPrefixName } from '@x86-toolkit/assembler/parser/utils';
import {
  isIRConstant,
  isIRVariable,
} from '@compiler/pico-c/frontend/ir/variables';

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
      allowedRegs: X86_ADDRESSING_REGS,
    });

    asm.push(...ptrVarReg.asm);
    destAddr = genMemAddress({
      size: getByteSizeArgPrefixName(ptrByteSize),
      expression: ptrVarReg.value,
      offset,
    });
  } else {
    // handle normal variable assign
    // a = 5;
    const prefix = getByteSizeArgPrefixName(value.type.getByteSize());

    destAddr = [
      prefix.toLocaleLowerCase(),
      stackFrame.getLocalVarStackRelAddress(outputVar.name, offset),
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
  } else if (isIRConstant(value)) {
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
