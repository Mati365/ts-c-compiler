import {CScopeTree} from '@compiler/pico-c/frontend/analyze';

import {IRGeneratorConfig} from '../../constants';
import {IRInstruction} from '../../instructions';
import {IRConstant, IRVariable} from '../../variables';
import {IRVariableAllocator} from '../IRVariableAllocator';

import type {emitAssignmentIR} from './emitAssignmentIR';
import type {emitExpressionIR} from './emitExpressionIR';
import type {emitLvalueExpression} from './emitLvalueExpressionIR';
import type {emitPointerExpression} from './emitPointerExpression';
import type {emitPointerAddressExpression} from './emitPointerAddressExpression';

export type IREmitterContext = {
  config: IRGeneratorConfig;
  allocator: IRVariableAllocator;
  emit: {
    assignment: typeof emitAssignmentIR,
    expression: typeof emitExpressionIR;
    pointerExpression: typeof emitPointerExpression;
    pointerAddressExpression: typeof emitPointerAddressExpression;
    lvalueExpression: typeof emitLvalueExpression;
  };
};

export type IREmitterContextAttrs = {
  scope: CScopeTree;
  context: IREmitterContext;
};

export type IREmitterStmtResult = {
  instructions: IRInstruction[];
};

export type IREmitterExpressionVarResult = IREmitterStmtResult & {
  output: IRVariable;
};

export type IREmitterExpressionResult = IREmitterStmtResult & {
  output: IRVariable | IRConstant;
};
