import * as R from 'ramda';

import { IsEmpty } from '@ts-c/core';
import { NodeLocation } from '@ts-c/grammar';
import { ASTCCompilerKind, ASTCCompilerNode } from './ASTCCompilerNode';
import { IsNewScopeASTNode } from '../../analyze/interfaces';
import { CScopeTree } from '../../analyze';

export class ASTCBlockItemsList
  extends ASTCCompilerNode
  implements IsEmpty, IsNewScopeASTNode
{
  scope?: CScopeTree;

  constructor(loc: NodeLocation, items: ASTCCompilerNode[]) {
    super(ASTCCompilerKind.BlockItemList, loc, items);
  }

  isEmpty() {
    return R.isEmpty(this.children);
  }
}
