import * as R from 'ramda';

import { isImplicitPtrType } from 'frontend/analyze/types/utils';
import { isPointerLikeType } from 'frontend/analyze';

import { ASTCCastUnaryExpression } from 'frontend/parser';
import {
  IRLeaInstruction,
  isIRLabelOffsetInstruction,
  isIRLeaInstruction,
} from '../../instructions';

import { IREmitterContextAttrs, IREmitterExpressionResult } from './types';

export type PointerAddressExpressionIREmitAttrs = IREmitterContextAttrs & {
  node: ASTCCastUnaryExpression;
};

export function emitPointerAddressExpression({
  context,
  scope,
  node,
}: PointerAddressExpressionIREmitAttrs): IREmitterExpressionResult {
  const { allocator } = context;
  const { instructions, output, ...result } = context.emit.identifierGetter({
    emitValueAtAddress: false,
    node: node.castExpression,
    context,
    scope,
  });

  // happens when expression looks like it:
  // struct Vec2* vec = &array;
  // array is loaded in emitIdentifierGetterIR as LEA
  // todo: Check if it is a good solution
  const lastInstruction = R.last(instructions);
  if (
    !output.isTemporary() &&
    !isIRLabelOffsetInstruction(lastInstruction) &&
    (!isIRLeaInstruction(lastInstruction) ||
      !isPointerLikeType(lastInstruction.inputVar.type) ||
      !isImplicitPtrType(lastInstruction.inputVar.type.baseType))
  ) {
    const addrVariable = allocator.allocTmpPointer(output.type);
    instructions.push(new IRLeaInstruction(output, addrVariable));

    return {
      ...result,
      output: addrVariable,
      instructions,
    };
  }

  return {
    ...result,
    output,
    instructions,
  };
}
