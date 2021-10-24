import * as R from 'ramda';

import {NodeLocation} from '@compiler/grammar/tree/NodeLocation';
import {CStorageClassSpecifier} from '@compiler/x86-nano-c/constants';
import {ASTCCompilerKind, ASTCCompilerNode} from './ASTCCompilerNode';
import {IsEmpty} from './interfaces/IsEmpty';

export class ASTCStorageClassSpecifiersList extends ASTCCompilerNode implements IsEmpty {
  constructor(
    loc: NodeLocation,
    public readonly items: CStorageClassSpecifier[],
  ) {
    super(ASTCCompilerKind.StorageClassSpecifiersList, loc);
  }

  isEmpty() {
    return R.isEmpty(this.items);
  }
}
