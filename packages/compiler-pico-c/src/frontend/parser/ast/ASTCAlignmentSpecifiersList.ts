import * as R from 'ramda';

import { walkOverFields } from '@ts-cc/grammar';

import { IsEmpty } from '@ts-cc/core';
import { NodeLocation } from '@ts-cc/grammar';
import { ASTCCompilerKind, ASTCCompilerNode } from './ASTCCompilerNode';
import { ASTCAlignmentSpecifier } from './ASTCAlignmentSpecifier';

@walkOverFields({
  fields: ['items'],
})
export class ASTCAlignmentSpecifiersList extends ASTCCompilerNode implements IsEmpty {
  constructor(
    loc: NodeLocation,
    readonly items: ASTCAlignmentSpecifier[],
  ) {
    super(ASTCCompilerKind.AlignmentSpecifiersList, loc);
  }

  isEmpty() {
    return R.isEmpty(this.items);
  }
}
