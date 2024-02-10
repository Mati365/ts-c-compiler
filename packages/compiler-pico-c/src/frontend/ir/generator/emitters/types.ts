import type { CScopeTree } from 'frontend/analyze';

import type { IRGeneratorConfig } from '../../constants';
import type {
  IRFnDeclInstruction,
  IRInstruction,
  IRLabelInstruction,
} from '../../instructions';

import type { IRInstructionTypedArg, IRVariable } from '../../variables';
import type { IRVariableAllocator } from '../IRVariableAllocator';

import type {
  IRFlatCodeSegmentBuilder,
  IRFlatCodeSegmentBuilderResult,
} from '../segments/IRFlatCodeSegmentBuilder';

import type { IRDataSegmentBuilder, IRDataSegmentBuilderResult } from '../segments';

import type { emitAssignmentIR } from './emitAssignmentIR';
import type { emitExpressionIR, LogicBinaryExpressionLabels } from './emit-expr';

import type { emitIdentifierGetterIR } from './emitIdentifierGetterIR';
import type { emitPointerAddressExpression } from './emitPointerAddressExpression';
import type { emitUnaryLoadPtrValueIR } from './emitUnaryLoadPointerValueIR';
import type { IRLabelsFactory } from '../IRLabelsFactory';
import type { emitLogicExpressionIR } from './emit-expr/emitLogicExpressionIR';
import type { emitBlockItemIR } from './emit-fn';
import type { emitVariableInitializerIR } from './emit-initializer';
import type { IRGlobalVariablesMap } from '../IRGlobalVariablesMap';
import type { IRGotoLabelsFactory } from '../IRGotoLabelsFactory';

export type IRGeneratorSegments = {
  code: IRFlatCodeSegmentBuilder;
  data: IRDataSegmentBuilder;
};

export type IREmitterContext = {
  globalVariables: IRGlobalVariablesMap;
  segments: IRGeneratorSegments;
  config: IRGeneratorConfig;
  allocator: IRVariableAllocator;
  factory: {
    labels: IRLabelsFactory;
    goto: IRGotoLabelsFactory;
  };
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
  loopStmt?: {
    startLabel: IRLabelInstruction;
    continueLabel?: IRLabelInstruction;
    finallyLabel: IRLabelInstruction;
  };
};

export type IREmitterInitializerMeta = {
  destVar: IRVariable;
  index: number;
  offset: number;
};

export type IREmitterContextAttrs = {
  scope: CScopeTree;
  context: IREmitterContext;
  initializerMeta?: IREmitterInitializerMeta;
};

export type IREmitterStmtResult = {
  instructions: IRInstruction[];
  data?: IRInstruction[];
};

export type IREmitterExpressionVarResult = IREmitterStmtResult & {
  output: IRVariable;
};

export type IREmitterExpressionResult = IREmitterStmtResult & {
  output: IRInstructionTypedArg;
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
  output: IRInstructionTypedArg = null,
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
  if (!src) {
    return target;
  }

  target.instructions.push(...(src.instructions || []));
  (target.data ||= []).push(...(src.data || []));

  return target;
}
