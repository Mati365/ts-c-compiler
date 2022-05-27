import {CScopeTree} from '@compiler/pico-c/frontend/analyze';

import {CIRGeneratorConfig} from '../../constants';
import {CIRBranchesBuilder} from '../CIRBranchesBuilder';
import {CIRVariableAllocator} from '../CIRVariableAllocator';

export type IREmitterContext = {
  config: CIRGeneratorConfig;
  allocator: CIRVariableAllocator;
  branchesBuilder: CIRBranchesBuilder;
};

export type IREmitterContextAttrs = {
  scope: CScopeTree;
  context: IREmitterContext;
};
