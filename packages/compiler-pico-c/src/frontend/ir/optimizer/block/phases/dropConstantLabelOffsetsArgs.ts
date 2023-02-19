import {
  IRInstruction,
  isIRCallInstruction,
  isIRLabelOffsetInstruction,
} from '../../../instructions';
import { IRLabel, isIRVariable } from '../../../variables';

/**
 * Replaces labels that are constants in instructions args.
 *
 * @example
 *  Transforms:
 *
 *  %t{0}: void sum(int, int)*2B = label-offset sum
 *  call %t{0}: void sum(int, int)*2B :: (%4: char1B, %4: char1B)
 *
 *  To:
 *
 *  call label-offset sum: void sum(int, int)*2B :: (%4: char1B, %4: char1B)
 */
export function dropConstantLabelOffsetsArgs(instructions: IRInstruction[]) {
  const newInstructions = [...instructions];
  const constantOffsets: Record<string, IRLabel> = {};

  for (let i = 0; i < instructions.length; ++i) {
    const instruction = instructions[i];

    // store label and treat it initially as constant
    if (isIRLabelOffsetInstruction(instruction)) {
      constantOffsets[instruction.outputVar.name] = instruction.label;
      continue;
    }

    // replace it is using constant offset load
    if (
      isIRCallInstruction(instruction) &&
      isIRVariable(instruction.fnPtr) &&
      constantOffsets[instruction.fnPtr.name]
    ) {
      newInstructions[i] = instruction.ofFnPtr(
        constantOffsets[instruction.fnPtr.name],
      );
      continue;
    }
  }

  return newInstructions;
}
