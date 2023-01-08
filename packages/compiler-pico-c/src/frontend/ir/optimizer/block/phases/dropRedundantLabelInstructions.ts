import { isWithLabeledBranches } from '../../../interfaces';
import {
  IRInstruction,
  IRLabelInstruction,
  isIRJmpInstruction,
  isIRLabelInstruction,
} from '../../../instructions';

export function dropRedundantLabelInstructions(instructions: IRInstruction[]) {
  const newInstructions = [...instructions];
  const cachedLabels: Record<string, IRLabelInstruction> = {};

  // first pass - collect all redundant label
  // instructions and remove them from list
  for (let i = 0; i < newInstructions.length; ) {
    const instruction = newInstructions[i];

    if (isIRLabelInstruction(instruction)) {
      for (++i; i < newInstructions.length; ) {
        const nextInstruction = newInstructions[i];
        if (!isIRLabelInstruction(nextInstruction)) {
          break;
        }

        cachedLabels[nextInstruction.name] = instruction;
        newInstructions.splice(i, 1);
      }
    } else {
      ++i;
    }
  }

  // second pass
  // - replace jmp / branches label names with cached ones
  // - if there is jmp instruction that immiddiately jmps to next label - remove it
  for (let i = 0; i < newInstructions.length; ) {
    let instruction = newInstructions[i];
    const nextInstruction = newInstructions[i + 1];

    if (isWithLabeledBranches(instruction)) {
      let modified = false;
      const newLabels = instruction.getLabels();

      for (let j = 0; j < newLabels.length; ++j) {
        const label = newLabels[j];
        if (!label) {
          continue;
        }

        const cachedLabel = label && cachedLabels[label.name];
        if (cachedLabel && cachedLabel !== label) {
          newLabels[j] = cachedLabel;
          modified = true;
        }
      }

      if (modified) {
        newInstructions[i] = instruction.ofLabels(newLabels);
        instruction = newInstructions[i];
      }
    }

    // detect and remove:
    // jmp L1
    // L1:
    if (
      isIRJmpInstruction(instruction) &&
      isIRLabelInstruction(nextInstruction) &&
      instruction.label.name === nextInstruction.name
    ) {
      newInstructions.splice(i, 1);
    } else {
      ++i;
    }
  }

  return newInstructions;
}
