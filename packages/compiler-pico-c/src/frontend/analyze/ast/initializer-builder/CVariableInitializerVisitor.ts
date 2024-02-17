import { isCompilerTreeNode } from 'frontend/parser';

import { AbstractTreeVisitor } from '@ts-cc/grammar';
import { CVariableInitializePair, CVariableInitializerTree } from '../../scope/variables';

export class CVariableInitializerVisitor extends AbstractTreeVisitor<
  CVariableInitializePair | CVariableInitializerTree
> {
  shouldVisitNode(node: CVariableInitializePair | CVariableInitializerTree): boolean {
    return !isCompilerTreeNode(node);
  }
}
