import {CScopeTree} from '@compiler/pico-c/frontend/analyze';

import {IRGeneratorConfig} from '../../constants';
import {IRInstruction} from '../../instructions';
import {IRConstant, IRVariable} from '../../variables';
import {IRVariableAllocator} from '../IRVariableAllocator';

import type {IRCodeSegmentBuilder, IRCodeSegmentBuilderResult} from '../segments/IRCodeSegmentBuilder';
import type {IRDataSegmentBuilder, IRDataSegmentBuilderResult} from '../segments';

import type {emitAssignmentIR} from './emitAssignmentIR';
import type {emitExpressionIR} from './emitExpressionIR';
import type {emitIdentifierGetterIR} from './emitIdentifierGetterIR';
import type {emitPointerAddressExpression} from './emitPointerAddressExpression';
import type {emitUnaryLoadPtrValueIR} from './emitUnaryLoadPointerValueIR';

export type IRGeneratorSegments = {
  code: IRCodeSegmentBuilder;
  data: IRDataSegmentBuilder;
};

export type IREmitterContext = {
  segments: IRGeneratorSegments;
  config: IRGeneratorConfig;
  allocator: IRVariableAllocator;
  emit: {
    assignment: typeof emitAssignmentIR,
    expression: typeof emitExpressionIR;
    pointerAddressExpression: typeof emitPointerAddressExpression;
    identifierGetter: typeof emitIdentifierGetterIR;
    unaryLoadPtrValueIR: typeof emitUnaryLoadPtrValueIR;
  };
};

export type IREmiiterInitializerMeta = {
  destVar: IRVariable;
  index: number;
  offset: number;
};

export type IREmitterContextAttrs = {
  scope: CScopeTree;
  context: IREmitterContext;
  initializerMeta?: IREmiiterInitializerMeta;
};

export type IREmitterStmtResult = {
  instructions: IRInstruction[];
  data?: IRInstruction[];
};

export type IREmitterExpressionVarResult = IREmitterStmtResult & {
  output: IRVariable;
};

export type IREmitterExpressionResult = IREmitterStmtResult & {
  output: IRVariable | IRConstant;
};

export type IRScopeGeneratorResult = {
  segments: {
    code: IRCodeSegmentBuilderResult;
    data: IRDataSegmentBuilderResult;
  },
};

export function createBlankStmtResult(instructions?: IRInstruction[]): IREmitterStmtResult {
  return {
    instructions: instructions || [],
    data: [],
  };
}

export function createBlankExprResult(
  instructions?: IRInstruction[],
  output: IRVariable = null,
): IREmitterExpressionResult {
  return {
    ...createBlankStmtResult(instructions),
    output,
  };
}

/**
 * Do not change instructions reference!
 */
export function appendStmtResults(src: IREmitterStmtResult, target: IREmitterStmtResult) {
  target.instructions.push(...(src.instructions || []));
  (target.data ||= []).push(...(src.data || []));

  return target;
}
