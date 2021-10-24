import * as R from 'ramda';

import {walkOverFields} from '@compiler/grammar/decorators/walkOverFields';

import {NodeLocation} from '@compiler/grammar/tree/NodeLocation';
import {CTypeQualifier} from '@compiler/x86-nano-c/constants';
import {ASTCCompilerKind, ASTCCompilerNode} from './ASTCCompilerNode';
import {IsEmpty} from './interfaces/IsEmpty';

@walkOverFields(
  {
    fields: ['items'],
  },
)
export class ASTCTypeQualifiersList extends ASTCCompilerNode implements IsEmpty {
  constructor(
    loc: NodeLocation,
    public readonly items: CTypeQualifier[],
  ) {
    super(ASTCCompilerKind.IdentifiersList, loc);
  }

  isEmpty() {
    return R.isEmpty(this.items);
  }
}
