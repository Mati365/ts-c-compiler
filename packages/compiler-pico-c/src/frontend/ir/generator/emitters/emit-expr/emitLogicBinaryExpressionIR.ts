import {TokenType} from '@compiler/lexer/shared';
import {CPrimitiveType} from '@compiler/pico-c/frontend/analyze';
import {ASTCBinaryOpNode} from '@compiler/pico-c/frontend/parser';

import {
  IRIfInstruction, IRInstruction,
  IRPhiInstruction, IRRelInstruction,
} from '../../../instructions';

import {IRConstant} from '../../../variables';
import {IREmitterContextAttrs, createBlankExprResult} from '../types';

export type BinaryExpressionCondInstructions = {
  ifTrue?: IRInstruction[];
  ifFalse?: IRInstruction[];
};

type LogicBinaryExpressionIREmitAttrs = IREmitterContextAttrs & {
  node: ASTCBinaryOpNode;
  withOutput?: boolean;
  instructions?: BinaryExpressionCondInstructions;
};

export function emitLogicBinaryExpressionIR(
  {
    scope,
    context,
    node,
    instructions,
    withOutput = true,
  }: LogicBinaryExpressionIREmitAttrs,
) {
  const {emit, config, factory, allocator} = context;
  const {arch} = config;
  const {op} = node;

  const result = createBlankExprResult();
  const results = {
    left: emit.expression(
      {
        node: node.left,
        context,
        scope,
      },
    ),

    right: emit.expression(
      {
        node: node.right,
        context,
        scope,
      },
    ),
  };

  const labels = {
    finally: factory.genTmpLabelInstruction(),
  };

  const cmpOp = (
    op === TokenType.AND
      ? TokenType.EQUAL
      : TokenType.DIFFERS
  );

  result.instructions.push(
    ...results.left.instructions,
    new IRIfInstruction(
      new IRRelInstruction(
        cmpOp,
        results.left.output,
        IRConstant.ofConstant(CPrimitiveType.int(arch), 0),
      ),
      labels.finally,
      null,
    ),
    ...results.right.instructions,
    ...(instructions?.ifFalse || []),
    labels.finally,
    ...(instructions?.ifTrue || []),
  );

  if (withOutput) {
    if (op === TokenType.OR) {
      result.output = allocator.allocTmpVariable(node.type);
      result.instructions.push(
        new IRPhiInstruction(
          [
            results.left.output,
            results.right.output,
          ],
          result.output,
        ),
      );
    } else
      result.output = results.right.output;
  }

  return result;
}
