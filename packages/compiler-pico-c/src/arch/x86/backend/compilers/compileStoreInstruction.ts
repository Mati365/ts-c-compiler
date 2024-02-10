import { CBackendError, CBackendErrorCode } from 'backend/errors/CBackendError';

import { getByteSizeArgPrefixName } from '@ts-c-compiler/x86-assembler';
import { getBaseTypeIfPtr } from 'frontend/analyze/types/utils';
import { IRStoreInstruction } from 'frontend/ir/instructions';

import { isIRConstant, isIRVariable } from 'frontend/ir/variables';
import { isPrimitiveLikeType } from 'frontend/analyze';

import { getTypeAtOffset } from 'frontend/ir/utils';
import { X86CompileInstructionOutput, compileMemcpy } from './shared';

import type { X87OwnershipStackEntry } from '../reg-allocator/x87/X87RegOwnershipTracker';

import { X86CompilerInstructionFnAttrs } from '../../constants/types';
import { isLabelOwnership } from '../reg-allocator';
import { genInstruction, genMemAddress, withInlineComment } from '../../asm-utils';

type StoreInstructionCompilerAttrs = X86CompilerInstructionFnAttrs<IRStoreInstruction>;

export function compileStoreInstruction({
  instruction,
  context,
}: StoreInstructionCompilerAttrs) {
  const { allocator } = context;
  const { outputVar, value, offset } = instruction;
  const { stackFrame, regs, memOwnership, x87regs, lifetime } = allocator;

  let destAddr: { value: string; size: number } = null;
  const output = new X86CompileInstructionOutput();

  const baseOutputType = getBaseTypeIfPtr(outputVar.type);
  const offsetOutputType = getTypeAtOffset(outputVar.type, offset);
  const offsetOutputByteSize = offsetOutputType.getByteSize();

  const isFloatingOutput =
    isPrimitiveLikeType(offsetOutputType, true) && offsetOutputType.isFloating();

  const isFloatingInput =
    isPrimitiveLikeType(value.type, true) && value.type.isFloating();

  if (outputVar.isTemporary()) {
    if (isFloatingOutput) {
      // TODO
      throw new Error('TODO');
    } else {
      // 1. handle pointers assign
      //  *(%t{0}) = 4;
      // 2. handle case when we have:
      //  *(%t{4}: struct Vec2*2B) = store %5: char1B
      //  in this case size should be loaded from left side and it should
      //  respect offset size of struct entry (for example `x` might have 1B size)
      const memPtrAddr = memOwnership.tryResolveIRArgAsAddr(outputVar, {
        forceLabelMemPtr: true,
      });

      if (memPtrAddr) {
        // handle case: %t{1}: const char**2B = alloca const char*2B
        // it can be reproduced in `printf("Hello");` call
        output.appendInstructions(...memPtrAddr.asm);
        destAddr = memPtrAddr;
      } else {
        const ptrVarReg = regs.tryResolveIRArgAsReg({
          arg: outputVar,
          allowedRegs: regs.ownership.getAvailableRegs().addressing,
        });

        output.appendInstructions(...ptrVarReg.asm);
        destAddr = {
          size: offsetOutputByteSize,
          value: genMemAddress({
            size: getByteSizeArgPrefixName(offsetOutputByteSize),
            expression: ptrVarReg.value,
            offset,
          }),
        };
      }
    }
  } else {
    // handle normal variable assign
    // *(a) = 5;
    // todo: check if this .isStructOrUnion() is needed:
    //  char b = 'b';
    //  int k = b;
    //  struct Abc {
    //    int x, y;
    //  } vec = { .y = 5 };
    //
    const prefix = getByteSizeArgPrefixName(offsetOutputByteSize);

    destAddr = {
      size: offsetOutputByteSize,
      value: [
        prefix.toLocaleLowerCase(),
        stackFrame.getLocalVarStackRelAddress(outputVar.name, { offset }),
      ].join(' '),
    };
  }

  if (isIRVariable(value)) {
    // check if variable is struct or something bigger than that
    if (
      getBaseTypeIfPtr(value.type).isStructOrUnion() &&
      getBaseTypeIfPtr(baseOutputType).isStructOrUnion() &&
      (!value.isTemporary() || isLabelOwnership(memOwnership.getVarOwnership(value.name)))
    ) {
      // copy structure A to B
      output.appendGroup(
        compileMemcpy({
          context,
          outputVar: outputVar,
          inputVar: value,
        }),
      );
    } else {
      if (isFloatingOutput) {
        let stackRegResult: X87OwnershipStackEntry = null;

        if (isFloatingInput) {
          // store floating point number
          // *(b{0}: float*2B) = store %t{1}: float4B
          stackRegResult = x87regs.tracker.getStackVar(value.name);
        } else {
          // store implicit casted integral type
          // *(b{0}: float*2B) = store %t{1}: int2B
          const pushResult = x87regs.tryResolveIRArgAsReg({
            arg: value,
            castedType: offsetOutputType,
            allowCast: true,
          });

          output.appendGroup(pushResult.asm);
          stackRegResult = pushResult.entry;
        }

        const storeResult = x87regs.storeStackRegAtAddress({
          reg: stackRegResult.reg,
          address: destAddr.value,
          pop: !lifetime.isVariableLaterUsed(allocator.iterator.offset, value.name),
        });

        output.appendGroups(storeResult.asm);
      } else {
        if (isFloatingInput) {
          // store float in integer variable
          // *(a{0}: int*2B) = store %t{1}: float4B

          const stackRegResult = x87regs.tracker.getStackVar(value.name);

          if (stackRegResult) {
            const storeResult = x87regs.storeStackRegAtAddress({
              integral: true,
              reg: stackRegResult.reg,
              address: destAddr.value,
              pop: !lifetime.isVariableLaterUsed(allocator.iterator.offset, value.name),
            });

            output.appendGroups(storeResult.asm);
          } else {
            throw new Error('TODO');
          }
        } else {
          // store int in integer variable
          // *(a{0}: int*2B) = store %t{1}: int2B

          // simple variables that can be stored inside regs
          let inputReg = regs.tryResolveIRArgAsReg({
            arg: value,
            forceLabelMemPtr: false,
          });

          if (inputReg.size - destAddr.size === 1) {
            // case: *(%t{1}: char*2B) = store %t{2}: int2B
            // bigger value is loaded in smaller address
            const part = regs.ownership.getAvailableRegs().general.parts[inputReg.value];

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

          output.appendInstructions(
            ...inputReg.asm,
            withInlineComment(
              genInstruction('mov', destAddr.value, inputReg.value),
              instruction.getDisplayName(),
            ),
          );
        }
      }
    }
  } else if (isIRConstant(value)) {
    if (isFloatingOutput) {
      const result = x87regs.storeConstantAtAddress({
        value,
        address: destAddr.value,
      });

      output.appendGroup(result);
    } else {
      output.appendInstructions(
        withInlineComment(
          genInstruction('mov', destAddr.value, value.constant),
          instruction.getDisplayName(),
        ),
      );
    }
  }

  if (output.isEmpty()) {
    throw new CBackendError(CBackendErrorCode.STORE_VAR_ERROR);
  }

  return output;
}
