import { isPrimitiveLikeType, type CType } from 'frontend/analyze';
import {
  IRConstant,
  isIRVariable,
  isIRConstant,
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
    isPrimitiveLikeType(expectedType, true) &&
    isPrimitiveLikeType(inputVar.type, true) &&
    !inputVar.type.ofQualifiers(0).isEqual(expectedType.ofQualifiers(0))
  ) {
    if (isIRVariable(inputVar)) {
      const castedInputVar = allocator.allocTmpVariable(expectedType);

      result.output = castedInputVar;
      result.instructions.push(new IRCastInstruction(inputVar, castedInputVar));
    } else if (
      isIRConstant(inputVar) &&
      inputVar.type.isFloating() &&
      expectedType.isIntegral()
    ) {
      result.output = IRConstant.ofConstant(expectedType, inputVar.constant);
    }
  }

  return result;
};
