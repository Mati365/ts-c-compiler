import { walkOverFields } from '@ts-c/grammar';

import { NodeLocation } from '@ts-c/grammar';
import { ASTCFunctionSpecifiersList } from './ASTCFunctionSpecifiersList';
import { ASTCCompilerKind, ASTCCompilerNode } from './ASTCCompilerNode';
import { ASTCStorageClassSpecifiersList } from './ASTCStorageClassSpecifiersList';
import { ASTCTypeQualifiersList } from './ASTCTypeQualifiersList';
import { ASTCTypeSpecifiersList } from './ASTCTypeSpecifiersList';
import { ASTCAlignmentSpecifiersList } from './ASTCAlignmentSpecifiersList';

@walkOverFields({
  fields: [
    'storageClassSpecifiers',
    'typeSpecifiers',
    'typeQualifiers',
    'functionSpecifiers',
    'alignmentSpecifiers',
  ],
})
export class ASTCDeclarationSpecifier extends ASTCCompilerNode {
  constructor(
    loc: NodeLocation,
    readonly storageClassSpecifiers: ASTCStorageClassSpecifiersList,
    readonly typeSpecifiers: ASTCTypeSpecifiersList,
    readonly typeQualifiers: ASTCTypeQualifiersList,
    readonly functionSpecifiers: ASTCFunctionSpecifiersList,
    readonly alignmentSpecifiers: ASTCAlignmentSpecifiersList,
  ) {
    super(ASTCCompilerKind.ParameterDeclarationSpecifier, loc);
  }

  dropEmpty(): ASTCDeclarationSpecifier {
    const {
      loc,
      functionSpecifiers,
      storageClassSpecifiers,
      typeSpecifiers,
      typeQualifiers,
      alignmentSpecifiers,
    } = this;

    return new ASTCDeclarationSpecifier(
      loc,
      storageClassSpecifiers.isEmpty() ? null : storageClassSpecifiers,
      typeSpecifiers.isEmpty() ? null : typeSpecifiers,
      typeQualifiers.isEmpty() ? null : typeQualifiers,
      functionSpecifiers.isEmpty() ? null : functionSpecifiers,
      alignmentSpecifiers.isEmpty() ? null : alignmentSpecifiers,
    );
  }
}
