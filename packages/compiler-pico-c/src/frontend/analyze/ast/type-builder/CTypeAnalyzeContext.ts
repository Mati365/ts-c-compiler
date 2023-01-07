import { CTypeCheckConfig } from '../../constants';
import { CScopeTree } from '../../scope/CScopeTree';
import { CFunctionDeclType } from '../../types';

export type CTypeAnalyzeContext = {
  abstract?: boolean;
  scope: CScopeTree;
  config: CTypeCheckConfig;
  currentAnalyzed: {
    fnType: CFunctionDeclType;
  };
};
