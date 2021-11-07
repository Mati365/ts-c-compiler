import * as R from 'ramda';

import {walkOverFields} from '@compiler/grammar/decorators/walkOverFields';

import {NodeLocation} from '@compiler/grammar/tree/NodeLocation';
import {IsEmpty} from './interfaces/IsEmpty';
import {ASTCCompilerKind, ASTCCompilerNode} from './ASTCCompilerNode';
import {ASTCDeclaration} from './ASTCDeclaration';

@walkOverFields(
  {
    fields: ['items'],
  },
)
export class ASTCDeclarationsList extends ASTCCompilerNode implements IsEmpty {
  constructor(
    loc: NodeLocation,
    public readonly items: ASTCDeclaration[],
  ) {
    super(ASTCCompilerKind.DeclarationsList, loc);
  }

  isEmpty() {
    return R.isEmpty(this.items);
  }
}
