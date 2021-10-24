import {walkOverFields} from '@compiler/grammar/decorators/walkOverFields';

import {NodeLocation} from '@compiler/grammar/tree/NodeLocation';
import {ASTCCompilerKind, ASTCCompilerNode} from './ASTCCompilerNode';
import {ASTCStorageClassSpecifiersList} from './ASTCStorageClassSpecifiersList';
import {ASTCTypeQualifiersList} from './ASTCTypeQualifiersList';
import {ASTCTypeSpecifiersList} from './ASTCTypeSpecifiersList';

@walkOverFields(
  {
    fields: [
      'storageClassSpecifiers',
      'typeSpecifiers',
      'typeQualifiers',
    ],
  },
)
export class ASTCDeclarationSpecifier extends ASTCCompilerNode {
  constructor(
    loc: NodeLocation,
    public readonly storageClassSpecifiers: ASTCStorageClassSpecifiersList,
    public readonly typeSpecifiers: ASTCTypeSpecifiersList,
    public readonly typeQualifiers: ASTCTypeQualifiersList,
  ) {
    super(ASTCCompilerKind.ParameterDeclarationSpecifier, loc);
  }

  dropEmpty(): ASTCDeclarationSpecifier {
    const {
      loc, storageClassSpecifiers,
      typeSpecifiers, typeQualifiers,
    } = this;

    return new ASTCDeclarationSpecifier(
      loc,
      storageClassSpecifiers.isEmpty() ? null : storageClassSpecifiers,
      typeSpecifiers.isEmpty() ? null : typeSpecifiers,
      typeQualifiers.isEmpty() ? null : typeQualifiers,
    );
  }
}
