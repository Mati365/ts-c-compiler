import * as R from 'ramda';

import {IsEmpty} from '@compiler/core/interfaces/IsEmpty';
import {NodeLocation} from '@compiler/grammar/tree/NodeLocation';
import {ASTCCompilerKind, ASTCCompilerNode} from './ASTCCompilerNode';

export class ASTCBlockItemsList extends ASTCCompilerNode implements IsEmpty {
  constructor(
    loc: NodeLocation,
    items: ASTCCompilerNode[],
  ) {
    super(ASTCCompilerKind.BlockItemList, loc, items);
  }

  isEmpty() {
    return R.isEmpty(this.children);
  }
}
