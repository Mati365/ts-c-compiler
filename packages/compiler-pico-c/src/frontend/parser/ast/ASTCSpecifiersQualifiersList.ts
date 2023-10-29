import { NodeLocation } from '@ts-c-compiler/grammar';
import { ASTCDeclarationSpecifier } from './ASTCDeclarationSpecifier';
import { ASTCTypeQualifiersList } from './ASTCTypeQualifiersList';
import { ASTCTypeSpecifiersList } from './ASTCTypeSpecifiersList';

export class ASTCSpecifiersQualifiersList extends ASTCDeclarationSpecifier {
  constructor(
    loc: NodeLocation,
    typeSpecifiers: ASTCTypeSpecifiersList,
    typeQualifiers: ASTCTypeQualifiersList,
  ) {
    super(loc, null, typeSpecifiers, typeQualifiers, null, null);
  }

  dropEmpty(): ASTCSpecifiersQualifiersList {
    const { loc, typeSpecifiers, typeQualifiers } = this;

    return new ASTCSpecifiersQualifiersList(
      loc,
      typeSpecifiers.isEmpty() ? null : typeSpecifiers,
      typeQualifiers.isEmpty() ? null : typeQualifiers,
    );
  }
}
