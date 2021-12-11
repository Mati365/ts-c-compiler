import {walkOverFields} from '@compiler/grammar/decorators/walkOverFields';

import {NodeLocation} from '@compiler/grammar/tree/NodeLocation';
import {ASTCStructDeclaration} from './ASTCStructDeclaration';
import {ASTCCompilerKind, ASTCCompilerNode} from './ASTCCompilerNode';

@walkOverFields(
  {
    fields: ['items'],
  },
)
export class ASTCStructDeclarationList extends ASTCCompilerNode {
  constructor(
    loc: NodeLocation,
    public readonly items: ASTCStructDeclaration[],
  ) {
    super(ASTCCompilerKind.StructDeclarationList, loc);
  }
}
