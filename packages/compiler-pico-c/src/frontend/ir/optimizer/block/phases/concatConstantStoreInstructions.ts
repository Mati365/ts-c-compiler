import { CPointerType, CPrimitiveType } from 'frontend/analyze';

import {
  IRInstruction,
  IRStoreInstruction,
  isIRStoreInstruction,
} from '../../../instructions';

import { IRConstant, isIRConstant } from '../../../variables';

/**
 * Merges two stores with byte size into one with word size
 *
 * Reduces:
 *
 * *(letters{0}: char[2]*2B) = store %72: char1B
 * *(letters{0}: char[2]*2B + %1) = store %101: char1B
 *
 * To:
 *
 * *(letters{0}: char[2]*2B) = store %72 | %101: int2B
 */
export function concatConstantStoreInstruction(instructions: IRInstruction[]) {
  const newInstructions = [...instructions];

  for (let i = 0; i < newInstructions.length; ++i) {
    const instruction = newInstructions[i];
    const nextInstruction = newInstructions[i + 1];

    if (
      !isIRStoreInstruction(instruction) ||
      !isIRStoreInstruction(nextInstruction) ||
      !isIRConstant(instruction.value) ||
      !isIRConstant(nextInstruction.value) ||
      !instruction.outputVar.isShallowEqual(nextInstruction.outputVar)
    ) {
      continue;
    }

    // todo: What about 32bit support?
    if (
      instruction.value.type.getByteSize() !== 1 ||
      nextInstruction.value.type.getByteSize() !== 1
    ) {
      continue;
    }

    const currentOffset = instruction.offset || 0;
    const nextOffset = nextInstruction.offset || 0;

    // detected two instructions with offset like this:
    // a = store ...
    // (a + 1) = store ...
    // try to contact them into one
    if (nextOffset - currentOffset === 1) {
      const wordValue =
        (instruction.value.constant & 0xff) |
        ((nextInstruction.value.constant & 0xff) << 0x8);

      const extendedPtrType = CPointerType.ofType(
        CPrimitiveType.address(instruction.outputVar.type.arch),
      );

      newInstructions[i] = new IRStoreInstruction(
        IRConstant.ofConstant(CPrimitiveType.int(instruction.value.type.arch), wordValue),
        instruction.outputVar.ofType(extendedPtrType),
        instruction.offset,
      );

      newInstructions.splice(i + 1, 1);
      --i;
    }
  }

  return newInstructions;
}
