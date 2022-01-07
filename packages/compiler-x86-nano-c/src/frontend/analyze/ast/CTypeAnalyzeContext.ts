import {CTypeCheckConfig} from '../constants';
import {CScopeTree} from '../scope/CScopeTree';
import {CFunctionNode} from '../scope/nodes';

export type CTypeAnalyzeContext = {
  scope: CScopeTree,
  config: CTypeCheckConfig,
  currentAnalyzed: {
    fnNode: CFunctionNode,
  },
};
