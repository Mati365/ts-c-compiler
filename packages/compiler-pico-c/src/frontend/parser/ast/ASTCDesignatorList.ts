import * as R from 'ramda';

import { NodeLocation } from '@compiler/grammar/tree/NodeLocation';
import { IsEmpty } from '@compiler/core/interfaces/IsEmpty';

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
