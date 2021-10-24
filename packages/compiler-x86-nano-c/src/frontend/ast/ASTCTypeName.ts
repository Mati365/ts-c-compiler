import {walkOverFields} from '@compiler/grammar/decorators/walkOverFields';

import {NodeLocation} from '@compiler/grammar/tree/NodeLocation';
import {ASTCCompilerKind, ASTCCompilerNode} from './ASTCCompilerNode';
import {ASTCTypeQualifiersList} from './ASTCTypeQualifiersList';
import {ASTCAbstractDeclarator} from './ASTCAbstractDeclarator';

@walkOverFields(
  {
    fields: [
      'qualifierList',
      'abstractDeclarator',
    ],
  },
)
export class ASTCTypeName extends ASTCCompilerNode {
  constructor(
    loc: NodeLocation,
    public readonly qualifierList: ASTCTypeQualifiersList,
    public readonly abstractDeclarator: ASTCAbstractDeclarator,
  ) {
    super(ASTCCompilerKind.TypeName, loc);
  }
}
