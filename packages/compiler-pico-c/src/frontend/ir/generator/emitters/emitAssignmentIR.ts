import { ASTCAssignmentExpression } from '@compiler/pico-c/frontend/parser';
import {
  CAssignOperator,
  CCOMPILER_ASSIGN_MATH_OPERATORS,
} from '@compiler/pico-c/constants';

import {
  IRLoadInstruction,
  IRMathInstruction,
  IRStoreInstruction,
} from '../../instructions';

import { isIRVariable } from '../../variables';
import {
  appendStmtResults,
  createBlankExprResult,
  IREmitterContextAttrs,
  IREmitterExpressionResult,
} from './types';

import { emitIdentifierGetterIR } from './emitIdentifierGetterIR';
import { emitExpressionIR } from './emit-expr';

export type AssignmentIREmitAttrs = IREmitterContextAttrs & {
  node: ASTCAssignmentExpression;
};

export function emitAssignmentIR({
  scope,
  context,
  node,
}: AssignmentIREmitAttrs): IREmitterExpressionResult {
  const { allocator } = context;
  const { operator } = node;

  // const instructions: IRInstruction[] = [];
  const result = createBlankExprResult();
  const lvalue = emitIdentifierGetterIR({
    node: node.unaryExpression,
    emitValueAtAddress: false,
    scope,
    context,
  });

  const rvalueType = node.expression.type;
  const rvalue = emitExpressionIR({
    node: node.expression,
    scope,
    context,
  });

  appendStmtResults(lvalue, result);
  appendStmtResults(rvalue, result);

  if (operator === CAssignOperator.ASSIGN) {
    // int abc = 5;
    result.output = rvalue.output;
  } else {
    // other operators such like: abc *= 2;
    const irSrcVar = allocator.allocTmpVariable(rvalueType);
    const tmpResultVar = allocator.allocTmpVariable(rvalueType);

    result.instructions.push(
      new IRLoadInstruction(lvalue.output, irSrcVar),
      new IRMathInstruction(
        CCOMPILER_ASSIGN_MATH_OPERATORS[operator],
        irSrcVar,
        rvalue.output,
        tmpResultVar,
      ),
    );

    result.output = tmpResultVar;
  }

  // prevent assign like a = a
  if (
    !isIRVariable(result.output) ||
    !result.output.isShallowEqual(lvalue.output)
  ) {
    result.instructions.push(
      new IRStoreInstruction(result.output, lvalue.output),
    );
  }

  return result;
}
