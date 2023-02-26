import { CScopeTree } from '@compiler/pico-c/frontend/analyze';

import { IRGeneratorConfig } from '../../constants';
import { IRFnDeclInstruction, IRInstruction } from '../../instructions';

import { IRConstant, IRVariable } from '../../variables';
import { IRVariableAllocator } from '../IRVariableAllocator';

import type {
  IRFlatCodeSegmentBuilder,
  IRFlatCodeSegmentBuilderResult,
} from '../segments/IRFlatCodeSegmentBuilder';

import type {
  IRDataSegmentBuilder,
  IRDataSegmentBuilderResult,
} from '../segments';

import type { emitAssignmentIR } from './emitAssignmentIR';
import type {
  emitExpressionIR,
  LogicBinaryExpressionLabels,
} from './emit-expr';

import type { emitIdentifierGetterIR } from './emitIdentifierGetterIR';
import type { emitPointerAddressExpression } from './emitPointerAddressExpression';
import type { emitUnaryLoadPtrValueIR } from './emitUnaryLoadPointerValueIR';
import type { IRInstructionFactory } from '../IRInstructionFactory';
import type { emitLogicExpressionIR } from './emit-expr/emitLogicExpressionIR';
import type { emitBlockItemIR } from './emit-fn-decl';
import type { emitVariableInitializerIR } from './emit-initializer';

export type IRGeneratorSegments = {
  code: IRFlatCodeSegmentBuilder;
  data: IRDataSegmentBuilder;
};

export type IREmitterContext = {
  segments: IRGeneratorSegments;
  config: IRGeneratorConfig;
  allocator: IRVariableAllocator;
  factory: IRInstructionFactory;
  emit: {
    assignment: typeof emitAssignmentIR;
    expression: typeof emitExpressionIR;
    logicExpression: typeof emitLogicExpressionIR;
    pointerAddressExpression: typeof emitPointerAddressExpression;
    identifierGetter: typeof emitIdentifierGetterIR;
    unaryLoadPtrValueIR: typeof emitUnaryLoadPtrValueIR;
    block: typeof emitBlockItemIR;
    initializer: typeof emitVariableInitializerIR;
  };
  fnStmt?: {
    declaration: IRFnDeclInstruction;
  };
  conditionStmt?: {
    labels: LogicBinaryExpressionLabels;
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
  allocator: IRVariableAllocator;
  segments: {
    code: IRFlatCodeSegmentBuilderResult;
    data: IRDataSegmentBuilderResult;
  };
};

export function createBlankStmtResult(
  instructions?: IRInstruction[],
): IREmitterStmtResult {
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
export function appendStmtResults(
  src: IREmitterStmtResult,
  target: IREmitterStmtResult,
) {
  if (!src) {
    return target;
  }

  target.instructions.push(...(src.instructions || []));
  (target.data ||= []).push(...(src.data || []));

  return target;
}
