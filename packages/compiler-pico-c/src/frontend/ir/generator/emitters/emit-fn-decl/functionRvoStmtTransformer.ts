import {
  IRLoadInstruction,
  isIRAllocInstruction,
  isIRLoadInstruction,
} from '../../../instructions';

import { IRError, IRErrorCode } from '../../../errors/IRError';
import { IRVariable } from '../../../variables';
import { IREmitterStmtResult } from '../types';

type RvoStmtTransformerAttrs = {
  stmtResult: IREmitterStmtResult;
  returnedVar: IRVariable;
  rvoOutputVar: IRVariable;
};

export function functionRvoStmtTransformer({
  stmtResult,
  returnedVar,
  rvoOutputVar,
}: RvoStmtTransformerAttrs): IREmitterStmtResult {
  const newInstructions = [...stmtResult.instructions];
  let optimized = false;
  let rvoOptimizedVar: IRVariable = null;

  for (let i = newInstructions.length - 1; i >= 0; ) {
    const instruction = newInstructions[i];

    if (
      !rvoOptimizedVar &&
      isIRLoadInstruction(instruction) &&
      instruction.outputVar.isShallowEqual(returnedVar)
    ) {
      // drop redundant load instruction at end of function
      newInstructions.splice(i, 1);
      rvoOptimizedVar = <IRVariable>instruction.inputVar;
    } else if (
      rvoOptimizedVar &&
      isIRAllocInstruction(instruction) &&
      instruction.outputVar.isShallowEqual(rvoOptimizedVar)
    ) {
      // replace alloc with pointer
      newInstructions[i] = new IRLoadInstruction(
        rvoOutputVar,
        instruction.outputVar,
      );
      optimized = true;
      break;
    } else {
      --i;
    }
  }

  if (!optimized && rvoOutputVar) {
    throw new IRError(IRErrorCode.RVO_OPTIMIZATION_FAIL);
  }

  return {
    ...stmtResult,
    instructions: newInstructions,
  };
}
