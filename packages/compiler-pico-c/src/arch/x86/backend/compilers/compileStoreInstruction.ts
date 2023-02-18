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

import { X86CompilerInstructionFnAttrs } from '../../constants/types';
import {
  genInstruction,
  genMemAddress,
  withInlineComment,
} from '../../asm-utils';

import {
  isArrayLikeType,
  isPointerLikeType,
} from '@compiler/pico-c/frontend/analyze';

type StoreInstructionCompilerAttrs =
  X86CompilerInstructionFnAttrs<IRStoreInstruction>;

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
      allowedRegs: regs.ownership.getAvailableRegs().addressing,
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
    // *(a) = 5;
    // todo: check if this .isStruct() is needed:
    //  char b = 'b';
    //  int k = b;
    //  struct Abc {
    //    int x, y;
    //  } vec = { .y = 5 };
    //
    const srcType = (() => {
      if (!isPointerLikeType(outputVar.type)) {
        throw new CBackendError(CBackendErrorCode.STORE_VAR_SHOULD_BE_PTR);
      }

      const { baseType } = outputVar.type;
      if (isArrayLikeType(baseType)) {
        return getSourceNonPtrType(baseType);
      }

      return baseType;
    })();

    const outputByteSize = (
      srcType.isStruct() ? value.type : srcType
    ).getByteSize();

    const prefix = getByteSizeArgPrefixName(outputByteSize);

    destAddr = {
      size: outputByteSize,
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

    if (inputReg.size - destAddr.size === 1) {
      // case: *(%t{1}: char*2B) = store %t{2}: int2B
      // bigger value is loaded in smaller address
      const part =
        regs.ownership.getAvailableRegs().general.parts[inputReg.value];

      inputReg = {
        ...inputReg,
        size: part.size,
        value: part.low,
      };
    } else if (inputReg.size - destAddr.size === -1) {
      // case: *(k{0}: int*2B) = store %t{0}: char1B
      // smaller value is loaded in bigger address
      const extendedReg = regs.requestReg({
        size: destAddr.size,
      });

      regs.ownership.setOwnership(value.name, {
        reg: extendedReg.value,
      });

      // extend value before move
      inputReg = {
        asm: [
          ...inputReg.asm,
          ...extendedReg.asm,
          genInstruction('movzx', extendedReg.value, inputReg.value),
        ],
        size: extendedReg.size,
        value: extendedReg.value,
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
