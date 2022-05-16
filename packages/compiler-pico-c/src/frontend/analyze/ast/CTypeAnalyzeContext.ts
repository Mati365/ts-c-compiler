import {CTypeCheckConfig} from '../constants';
import {CScopeTree} from '../scope/CScopeTree';
import {CFunctionDeclType} from '../types';

export type CTypeAnalyzeContext = {
  scope: CScopeTree,
  config: CTypeCheckConfig,
  currentAnalyzed: {
    fnType: CFunctionDeclType,
  },
};
