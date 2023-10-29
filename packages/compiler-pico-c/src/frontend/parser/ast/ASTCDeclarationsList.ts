import * as R from 'ramda';

import { NodeLocation } from '@ts-c-compiler/grammar';
import { IsEmpty } from '@ts-c-compiler/core';

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
