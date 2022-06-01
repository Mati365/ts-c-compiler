import {CScopeTree} from '@compiler/pico-c/frontend/analyze';

import {CIRGeneratorConfig} from '../../constants';
import {CIRInstruction} from '../../instructions';
import {CIRConstant, CIRVariable} from '../../variables';
import {CIRVariableAllocator} from '../CIRVariableAllocator';

export type IREmitterContext = {
  config: CIRGeneratorConfig;
  allocator: CIRVariableAllocator;
};

export type IREmitterContextAttrs = {
  scope: CScopeTree;
  context: IREmitterContext;
};

export type IREmitterExpressionResult = {
  output: CIRVariable | CIRConstant;
  instructions: CIRInstruction[];
};
