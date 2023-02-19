import {
  IRAssignInstruction,
  isIRAllocInstruction,
  isIRLoadInstruction,
} from '../../../instructions';

import { dropConstantInstructionArgs } from '../../../optimizer/block/utils/dropConstantInstructionArgs';

import { IRError, IRErrorCode } from '../../../errors/IRError';
import { IRVariable } from '../../../variables';
import { IREmitterContext, IREmitterStmtResult } from '../types';

type RvoStmtTransformerAttrs = {
  context: IREmitterContext;
  stmtResult: IREmitterStmtResult;
  returnedVar: IRVariable;
  rvoOutputVar: IRVariable;
};

export function functionRvoStmtTransformer({
  context,
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
      // replace all optimize variable occurs with argument
      const tmpStructVar = context.allocator.allocTmpVariable(
        rvoOutputVar.type,
      );

      const replaceMap = {
        [instruction.outputVar.name]: tmpStructVar,
      };

      newInstructions[i] = new IRAssignInstruction(rvoOutputVar, tmpStructVar, {
        preferAddressRegsOutput: true,
      });

      for (let j = i; j < newInstructions.length; ++j) {
        const optimizedInstruction = dropConstantInstructionArgs(
          replaceMap,
          newInstructions[j],
        );

        if (optimizedInstruction) {
          newInstructions[j] = optimizedInstruction;
        }
      }

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
