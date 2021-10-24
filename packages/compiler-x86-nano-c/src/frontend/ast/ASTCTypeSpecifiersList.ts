import * as R from 'ramda';

import {walkOverFields} from '@compiler/grammar/decorators/walkOverFields';

import {NodeLocation} from '@compiler/grammar/tree/NodeLocation';
import {ASTCCompilerKind, ASTCCompilerNode} from './ASTCCompilerNode';
import {ASTCTypeSpecifier} from './ASTCTypeSpecifier';
import {IsEmpty} from './interfaces/IsEmpty';

@walkOverFields(
  {
    fields: ['items'],
  },
)
export class ASTCTypeSpecifiersList extends ASTCCompilerNode implements IsEmpty {
  constructor(
    loc: NodeLocation,
    public readonly items: ASTCTypeSpecifier[],
  ) {
    super(ASTCCompilerKind.TypeSpecifiersList, loc);
  }

  isEmpty() {
    return R.isEmpty(this.items);
  }
}
