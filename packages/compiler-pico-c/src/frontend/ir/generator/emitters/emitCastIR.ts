import { isPrimitiveLikeType, type CType } from 'frontend/analyze';
import {
  isIRVariable,
  type IRInstructionTypedArg,
} from 'frontend/ir/variables';

import {
  createBlankExprResult,
  type IREmitterContext,
  type IREmitterExpressionResult,
} from './types';

import { IRCastInstruction } from 'frontend/ir/instructions';

type CastIREmitAttrs = {
  context: IREmitterContext;
  expectedType: CType;
  inputVar: IRInstructionTypedArg;
};

export const emitCastIR = ({
  context,
  expectedType,
  inputVar,
}: CastIREmitAttrs): IREmitterExpressionResult => {
  const { allocator } = context;
  const result = createBlankExprResult([], inputVar);

  if (
    isIRVariable(inputVar) &&
    isPrimitiveLikeType(expectedType, true) &&
    isPrimitiveLikeType(inputVar.type, true) &&
    !inputVar.type.ofQualifiers(0).isEqual(expectedType.ofQualifiers(0))
  ) {
    const castedInputVar = allocator.allocTmpVariable(expectedType);

    result.output = castedInputVar;
    result.instructions.push(new IRCastInstruction(inputVar, castedInputVar));
  }

  return result;
};
