import {CScopeTree} from '@compiler/pico-c/frontend/analyze';

import {CIRGeneratorConfig} from '../../constants';
import {CIRVariableAllocator} from '../CIRVariableAllocator';

export type IREmitterContext = {
  config: CIRGeneratorConfig;
  allocator: CIRVariableAllocator;
};

export type IREmitterContextAttrs = {
  scope: CScopeTree;
  context: IREmitterContext;
};
