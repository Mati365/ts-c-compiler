import {walkOverFields} from '@compiler/grammar/decorators/walkOverFields';

import {NodeLocation} from '@compiler/grammar/tree/NodeLocation';
import {ASTCCompilerKind, ASTCCompilerNode} from './ASTCCompilerNode';
import {ASTCTypeQualifiersList} from './ASTCTypeQualifiersList';
import {ASTCTypeSpecifiersList} from './ASTCTypeSpecifiersList';

@walkOverFields(
  {
    fields: [
      'typeSpecifiers',
      'typeQualifiers',
    ],
  },
)
export class ASTCSpecifiersQualifiersList extends ASTCCompilerNode {
  constructor(
    loc: NodeLocation,
    public readonly typeSpecifiers: ASTCTypeSpecifiersList,
    public readonly typeQualifiers: ASTCTypeQualifiersList,
  ) {
    super(ASTCCompilerKind.ParameterDeclarationSpecifier, loc);
  }

  dropEmpty(): ASTCSpecifiersQualifiersList {
    const {loc, typeSpecifiers, typeQualifiers} = this;

    return new ASTCSpecifiersQualifiersList(
      loc,
      typeSpecifiers.isEmpty() ? null : typeSpecifiers,
      typeQualifiers.isEmpty() ? null : typeQualifiers,
    );
  }
}
