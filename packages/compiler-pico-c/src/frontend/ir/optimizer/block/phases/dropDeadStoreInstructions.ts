import { getBaseTypeIfPtr } from 'frontend/analyze/types/utils';
import { isIRVariable } from '../../../variables';
import { isIRBranchInstruction } from '../../../guards';
import {
  IRInstruction,
  IRStoreInstruction,
  isIRLoadInstruction,
  isIRStoreInstruction,
} from '../../../instructions';

export function dropDeadStoreInstructions(instructions: IRInstruction[]) {
  let cachedStore: Record<string, IRStoreInstruction[]> = {};
  const newInstructions = [...instructions];

  const dropNotUsedStoreInstructions = (list: IRStoreInstruction[]) => {
    if (!list) {
      return;
    }

    for (let i = 0; i < list.length - 1; ++i) {
      newInstructions.splice(newInstructions.indexOf(list[i]), 1);
    }
  };

  const flush = () => {
    for (const storeInstructions of Object.values(cachedStore)) {
      dropNotUsedStoreInstructions(storeInstructions);
    }

    cachedStore = {};
  };

  for (let i = 0; i < newInstructions.length; ++i) {
    const instruction = newInstructions[i];

    if (isIRBranchInstruction(instruction)) {
      flush();
    } else if (
      isIRLoadInstruction(instruction) &&
      isIRVariable(instruction.inputVar)
    ) {
      const name = `${instruction.inputVar.name}-0`;
      const cachedInstructions = cachedStore[name];

      dropNotUsedStoreInstructions(cachedInstructions);
      delete cachedStore[name];
    } else if (
      isIRStoreInstruction(instruction) &&
      getBaseTypeIfPtr(instruction.outputVar.type).canBeStoredInReg()
    ) {
      const name = `${instruction.outputVar.name}-${instruction.offset}`;
      (cachedStore[name] ||= []).push(instruction);
    }
  }

  flush();
  return newInstructions;
}
