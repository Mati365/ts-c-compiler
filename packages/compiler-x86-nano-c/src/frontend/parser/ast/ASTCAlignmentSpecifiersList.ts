import * as R from 'ramda';

import {walkOverFields} from '@compiler/grammar/decorators/walkOverFields';

import {IsEmpty} from '@compiler/core/interfaces/IsEmpty';
import {NodeLocation} from '@compiler/grammar/tree/NodeLocation';
import {ASTCCompilerKind, ASTCCompilerNode} from './ASTCCompilerNode';
import {ASTCAlignmentSpecifier} from './ASTCAlignmentSpecifier';

@walkOverFields(
  {
    fields: ['items'],
  },
)
export class ASTCAlignmentSpecifiersList extends ASTCCompilerNode implements IsEmpty {
  constructor(
    loc: NodeLocation,
    public readonly items: ASTCAlignmentSpecifier[],
  ) {
    super(ASTCCompilerKind.AlignmentSpecifiersList, loc);
  }

  isEmpty() {
    return R.isEmpty(this.items);
  }
}
