import {walkOverFields} from '@compiler/grammar/decorators/walkOverFields';

import {NodeLocation} from '@compiler/grammar/tree/NodeLocation';
import {ASTCCompilerKind, ASTCCompilerNode} from './ASTCCompilerNode';
import {ASTCStructDeclarator} from './ASTCStructDeclarator';

@walkOverFields(
  {
    fields: ['items'],
  },
)
export class ASTCStructDeclaratorList extends ASTCCompilerNode {
  constructor(
    loc: NodeLocation,
    public readonly items: ASTCStructDeclarator[],
  ) {
    super(ASTCCompilerKind.StructDeclaratorList, loc);
  }
}
