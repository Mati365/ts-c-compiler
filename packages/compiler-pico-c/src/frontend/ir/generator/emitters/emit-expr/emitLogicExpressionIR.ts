import {TokenType} from '@compiler/lexer/shared';
import {CPrimitiveType} from '@compiler/pico-c/frontend/analyze';
import {ASTCBinaryOpNode} from '@compiler/pico-c/frontend/parser';

import {IRIfInstruction, IRPhiInstruction, IRRelInstruction} from '../../../instructions';
import {IRConstant, IRInstructionVarArg} from '../../../variables';
import {IREmitterContextAttrs, createBlankExprResult} from '../types';

type OrExpressionIREmitAttrs = IREmitterContextAttrs & {
  node: ASTCBinaryOpNode;
};

export function emitLogicExpressionIR(
  {
    scope,
    context,
    node,
  }: OrExpressionIREmitAttrs,
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
    labels.finally,
  );

  let output: IRInstructionVarArg;
  if (op === TokenType.OR) {
    output = allocator.allocTmpVariable(node.type);
    result.instructions.push(
      new IRPhiInstruction(
        [
          results.left.output,
          results.right.output,
        ],
        output,
      ),
    );
  } else
    ({output} = results.right);

  return {
    ...result,
    output,
  };
}
