import {CTypeCheckConfig} from './constants';
import {CScopeTree} from './scope/CScopeTree';

export type CAnalyzeContext = {
  scope: CScopeTree,
  config: CTypeCheckConfig,
};
