import { ASTCAssignmentExpression } from 'frontend/parser';
import { CAssignOperator, CCOMPILER_ASSIGN_MATH_OPERATORS } from '#constants';

import { getBaseTypeIfPtr } from 'frontend/analyze/types/utils';

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
import { emitCastIR } from './emitCastIR';

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

  const rvalue = emitExpressionIR({
    node: node.expression,
    scope,
    context,
  });

  // auto cast between types:
  // char letters[] = "Hello world";
  // letters[0] = 1;
  // in this case there should be auto cast `1` value to char
  appendStmtResults(lvalue, result);
  appendStmtResults(rvalue, result);

  if (operator === CAssignOperator.ASSIGN) {
    // int abc = 5;
    result.output = rvalue.output;
  } else {
    // other operators such like: abc *= 2;
    const lvalueType = getBaseTypeIfPtr(lvalue.output.type);
    const irSrcVar = allocator.allocTmpVariable(lvalueType);
    const tmpResultVar = allocator.allocTmpVariable(lvalueType);

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
    const castResult = emitCastIR({
      context,
      expectedType: getBaseTypeIfPtr(lvalue.output.type),
      inputVar: result.output,
    });

    appendStmtResults(castResult, result);
    result.instructions.push(
      new IRStoreInstruction(result.output, lvalue.output),
    );
  }

  return result;
}
