import * as R from 'ramda';

import { NodeLocation } from '@ts-c/grammar';
import { IsEmpty } from '@ts-c/core';

import { ASTCCompilerKind, ASTCCompilerNode } from './ASTCCompilerNode';
import { ASTCDesignator } from './ASTCDesignator';

export class ASTCDesignatorList
  extends ASTCCompilerNode<ASTCDesignator>
  implements IsEmpty
{
  constructor(loc: NodeLocation, items: ASTCDesignator[]) {
    super(ASTCCompilerKind.DesignatorList, loc, items);
  }

  isEmpty() {
    return R.isEmpty(this.children);
  }
}
