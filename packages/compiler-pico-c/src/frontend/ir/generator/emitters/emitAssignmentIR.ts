import {ASTCAssignmentExpression} from '@compiler/pico-c/frontend/parser';
import {CAssignOperator, CCOMPILER_ASSIGN_MATH_OPERATORS} from '@compiler/pico-c/constants';

import {
  CIRInstruction,
  CIRMathInstruction,
  CIRStoreInstruction,
} from '../../instructions';

import {CIRInstructionVarArg} from '../../variables';
import {IREmitterContextAttrs, IREmitterExpressionResult} from './types';

import {emitLvalueExpression} from './emitLvalueExpressionIR';
import {emitExpressionIR} from './emitExpressionIR';

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

  const instructions: CIRInstruction[] = [];
  const lvalue = emitLvalueExpression(
    {
      node: node.unaryExpression,
      emitLoadPtr: false,
      scope,
      context,
    },
  );

  const rvalueType = node.expression.type;
  const rvalue = emitExpressionIR(
    {
      node: node.expression,
      type: rvalueType,
      scope,
      context,
    },
  );

  instructions.push(
    ...lvalue.instructions,
    ...rvalue.instructions,
  );

  let assignResult: CIRInstructionVarArg = null;
  if (operator === CAssignOperator.ASSIGN) {
    // int abc = 5;
    assignResult = rvalue.output;
  } else {
    // load tmp ptr
    const tmpResultVar = allocator.allocTmpVariable(rvalueType);

    instructions.push(
      new CIRMathInstruction(
        CCOMPILER_ASSIGN_MATH_OPERATORS[operator],
        lvalue.output,
        rvalue.output,
        tmpResultVar,
      ),
    );

    assignResult = tmpResultVar;
  }

  instructions.push(
    new CIRStoreInstruction(assignResult, lvalue.output),
  );

  return {
    output: assignResult,
    instructions,
  };
}
