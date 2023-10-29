import * as R from 'ramda';

import { NodeLocation } from '@ts-c-compiler/grammar';
import { IsEmpty } from '@ts-c-compiler/core';

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
