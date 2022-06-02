import {CIRInstruction} from '../../instructions';
import {tryConcatInstructions} from './tryConcatInstructions';

export type IRInstructionsOptimizationAttrs = {
  enabled?: boolean;
};

/**
 * Optimizes instructions list by eliminate const expr.
 *
 * @see
 *  Input and output on first and last instructions must be preserved!
 */
export function optimizeInstructionsList(
  {
    enabled = true,
  }: IRInstructionsOptimizationAttrs,
  instructions: CIRInstruction[],
) {
  if (!enabled)
    return instructions;

  const newInstructions = [...instructions];
  for (let i = 1; i < newInstructions.length;) {
    const concatedInstruction = tryConcatInstructions(
      {
        a: newInstructions[i - 1],
        b: newInstructions[i],
      },
    );

    if (concatedInstruction.isSome()) {
      newInstructions[i - 1] = concatedInstruction.unwrap();
      newInstructions.splice(i, 1);
    } else
      ++i;
  }

  return newInstructions;
}
