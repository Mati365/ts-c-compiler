import {walkOverFields} from '@compiler/grammar/decorators/walkOverFields';

import {NodeLocation} from '@compiler/grammar/tree/NodeLocation';
import {ASTCCompilerKind, ASTCCompilerNode} from './ASTCCompilerNode';
import {ASTCAbstractDeclarator} from './ASTCAbstractDeclarator';
import {ASTCSpecifiersQualifiersList} from './ASTCSpecifiersQualifiersList';

@walkOverFields(
  {
    fields: [
      'specifierList',
      'abstractDeclarator',
    ],
  },
)
export class ASTCTypeName extends ASTCCompilerNode {
  constructor(
    loc: NodeLocation,
    readonly specifierList: ASTCSpecifiersQualifiersList,
    readonly abstractDeclarator?: ASTCAbstractDeclarator,
  ) {
    super(ASTCCompilerKind.TypeName, loc);
  }
}
