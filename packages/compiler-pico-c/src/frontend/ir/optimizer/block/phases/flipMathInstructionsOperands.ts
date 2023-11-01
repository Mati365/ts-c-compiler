import * as O from 'fp-ts/Option';
import { IRInstruction, isIRMathInstruction } from '../../../instructions';

/**
 * Some statements, such like this:
 *  char c = 2 + letters[0];
 *
 * Generates slower code. It is mostly because compiler not know if `2` value
 * needs to be stored in register or not. So it is allocating reg for `2` value
 * and then for `letters[0]`. It is slow. It should alloc reg only for `letters[0]`
 * and then add `2` constant to it. The easiest way to optimize it is just flip operands like this:
 *
 *  char c = letters[0] + 2;
 *
 *  Output should be much faster.
 */
export function flipMathInstructionsOperands(instructions: IRInstruction[]) {
  const newInstructions = [...instructions];

  for (let i = 0; i < newInstructions.length; ++i) {
    const instruction = newInstructions[i];

    if (!isIRMathInstruction(instruction)) {
      continue;
    }

    const flipResult = instruction.tryFlipConstantsToRight();
    if (O.isSome(flipResult)) {
      newInstructions[i] = flipResult.value;
    }
  }

  return newInstructions;
}
