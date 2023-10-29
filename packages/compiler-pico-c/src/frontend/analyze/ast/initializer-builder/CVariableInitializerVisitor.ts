import { isCompilerTreeNode } from 'frontend/parser';

import { AbstractTreeVisitor } from '@ts-c/grammar';
import { CVariableInitializeValue } from '../../scope/variables';

export class CVariableInitializerVisitor extends AbstractTreeVisitor<CVariableInitializeValue> {
  shouldVisitNode(node: CVariableInitializeValue): boolean {
    return !isCompilerTreeNode(node);
  }
}
