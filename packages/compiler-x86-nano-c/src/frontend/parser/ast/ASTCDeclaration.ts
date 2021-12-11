import {walkOverFields} from '@compiler/grammar/decorators/walkOverFields';

import {NodeLocation} from '@compiler/grammar/tree/NodeLocation';
import {ASTCDeclarationSpecifier} from './ASTCDeclarationSpecifier';
import {ASTCCompilerKind, ASTCCompilerNode} from './ASTCCompilerNode';
import {ASTCInitDeclaratorList} from './ASTCInitDeclaratorList';

@walkOverFields(
  {
    fields: [
      'specifiers',
      'initList',
    ],
  },
)
export class ASTCDeclaration extends ASTCCompilerNode {
  constructor(
    loc: NodeLocation,
    public readonly specifiers: ASTCDeclarationSpecifier,
    public readonly initList: ASTCInitDeclaratorList,
  ) {
    super(ASTCCompilerKind.Declaration, loc);
  }
}
