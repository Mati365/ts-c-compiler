import * as R from 'ramda';

import { NodeLocation } from '@compiler/grammar/tree/NodeLocation';
import { IsEmpty } from '@compiler/core/interfaces/IsEmpty';

import { ASTCCompilerKind, ASTCCompilerNode } from './ASTCCompilerNode';
import { ASTCDeclaration } from './ASTCDeclaration';

export class ASTCDeclarationsList
  extends ASTCCompilerNode<ASTCDeclaration>
  implements IsEmpty
{
  constructor(loc: NodeLocation, items: ASTCDeclaration[]) {
    super(ASTCCompilerKind.DeclarationsList, loc, items);
  }

  isEmpty() {
    return R.isEmpty(this.children);
  }
}
