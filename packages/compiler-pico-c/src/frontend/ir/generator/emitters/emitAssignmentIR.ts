import {ASTCAssignmentExpression} from '@compiler/pico-c/frontend/parser';
import {CAssignOperator, CCOMPILER_ASSIGN_MATH_OPERATORS} from '@compiler/pico-c/constants';

import {
  CIRInstruction,
  CIRMathInstruction,
  CIRStoreInstruction,
} from '../../instructions';

import {CIRInstructionVarArg} from '../../variables';
import {IRInstructionsOptimizationAttrs, optimizeInstructionsList} from '../optimization';
import {IREmitterContextAttrs, IREmitterExpressionResult} from './types';

import {emitLvalueExpression} from './emitLvalueExpressionIR';
import {emitExpressionIR} from './emitExpressionIR';

export type AssignmentIREmitAttrs = IREmitterContextAttrs & {
  optimization?: IRInstructionsOptimizationAttrs;
  node: ASTCAssignmentExpression;
};

export function emitAssignmentIR(
  {
    optimization = {},
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
      optimization: {
        enabled: false,
      },
    },
  );

  const {type} = lvalue.output;
  const rvalue = emitExpressionIR(
    {
      node: node.expression,
      type,
      scope,
      context,
      optimization: {
        enabled: false,
      },
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
    const tmpResultVar = allocator.allocTmpVariable(type);

    instructions.push(
      new CIRMathInstruction(
        CCOMPILER_ASSIGN_MATH_OPERATORS[operator],
        lvalue.output,
        rvalue.output,
        tmpResultVar.name,
      ),
    );

    assignResult = tmpResultVar;
  }

  instructions.push(
    new CIRStoreInstruction(
      assignResult,
      lvalue.output.name,
    ),
  );

  return {
    output: assignResult,
    instructions: optimizeInstructionsList(optimization, instructions),
  };
}
