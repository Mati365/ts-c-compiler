import {walkOverFields} from '@compiler/grammar/decorators/walkOverFields';

import {NodeLocation} from '@compiler/grammar/tree/NodeLocation';
import {ASTCInitDeclarator} from './ASTCInitDeclarator';
import {ASTCCompilerKind, ASTCCompilerNode} from './ASTCCompilerNode';

@walkOverFields(
  {
    fields: ['items'],
  },
)
export class ASTCInitDeclaratorList extends ASTCCompilerNode {
  constructor(
    loc: NodeLocation,
    public readonly items: ASTCInitDeclarator[],
  ) {
    super(ASTCCompilerKind.InitDeclaratorList, loc);
  }
}
