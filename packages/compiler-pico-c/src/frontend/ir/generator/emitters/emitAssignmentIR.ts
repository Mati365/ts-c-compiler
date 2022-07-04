import {ASTCAssignmentExpression} from '@compiler/pico-c/frontend/parser';
import {CAssignOperator, CCOMPILER_ASSIGN_MATH_OPERATORS} from '@compiler/pico-c/constants';

import {
  IRInstruction,
  IRLoadInstruction,
  IRMathInstruction,
  IRStoreInstruction,
} from '../../instructions';

import {IRInstructionVarArg, isIRVariable} from '../../variables';
import {IREmitterContextAttrs, IREmitterExpressionResult} from './types';

import {emitIdentifierGetterIR} from './emitIdentifierGetterIR';
import {emitExpressionIR} from './emit-expr';

export type AssignmentIREmitAttrs = IREmitterContextAttrs & {
  node: ASTCAssignmentExpression;
};

export function emitAssignmentIR(
  {
    scope,
    context,
    node,
  }: AssignmentIREmitAttrs,
): IREmitterExpressionResult {
  const {allocator} = context;
  const {operator} = node;

  const instructions: IRInstruction[] = [];
  const lvalue = emitIdentifierGetterIR(
    {
      node: node.unaryExpression,
      emitValueAtAddress: false,
      scope,
      context,
    },
  );

  const rvalueType = node.expression.type;
  const rvalue = emitExpressionIR(
    {
      node: node.expression,
      scope,
      context,
    },
  );

  instructions.push(
    ...lvalue.instructions,
    ...rvalue.instructions,
  );

  let assignResult: IRInstructionVarArg = null;
  if (operator === CAssignOperator.ASSIGN) {
    // int abc = 5;
    assignResult = rvalue.output;
  } else  {
    // other operators such like: abc *= 2;
    const irSrcVar = allocator.allocTmpVariable(rvalueType);
    const tmpResultVar = allocator.allocTmpVariable(rvalueType);

    instructions.push(
      new IRLoadInstruction(lvalue.output, irSrcVar),
      new IRMathInstruction(
        CCOMPILER_ASSIGN_MATH_OPERATORS[operator],
        irSrcVar,
        rvalue.output,
        tmpResultVar,
      ),
    );

    assignResult = tmpResultVar;
  }

  // prevent assign like a = a
  if (!isIRVariable(assignResult) || !assignResult.isShallowEqual(lvalue.output)) {
    instructions.push(
      new IRStoreInstruction(assignResult, lvalue.output),
    );
  }

  return {
    output: assignResult,
    instructions,
  };
}
