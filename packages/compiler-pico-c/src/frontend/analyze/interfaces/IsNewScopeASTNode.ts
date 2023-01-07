import type { CScopeTree } from '../scope/CScopeTree';

export interface IsNewScopeASTNode {
  scope?: CScopeTree;
}

export function isNewScopeASTNode(node: any): node is IsNewScopeASTNode {
  return 'scope' in node;
}
