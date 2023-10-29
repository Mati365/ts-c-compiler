import * as R from 'ramda';

import { walkOverFields } from '@ts-c-compiler/grammar';

import { IsEmpty } from '@ts-c-compiler/core';
import { NodeLocation } from '@ts-c-compiler/grammar';
import { ASTCCompilerKind, ASTCCompilerNode } from './ASTCCompilerNode';
import { ASTCAlignmentSpecifier } from './ASTCAlignmentSpecifier';

@walkOverFields({
  fields: ['items'],
})
export class ASTCAlignmentSpecifiersList
  extends ASTCCompilerNode
  implements IsEmpty
{
  constructor(loc: NodeLocation, readonly items: ASTCAlignmentSpecifier[]) {
    super(ASTCCompilerKind.AlignmentSpecifiersList, loc);
  }

  isEmpty() {
    return R.isEmpty(this.items);
  }
}
