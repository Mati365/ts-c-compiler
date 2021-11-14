import {walkOverFields} from '@compiler/grammar/decorators/walkOverFields';

import {NodeLocation} from '@compiler/grammar/tree/NodeLocation';
import {ASTCFunctionSpecifiersList} from './ASTCFunctionSpecifiersList';
import {ASTCCompilerKind, ASTCCompilerNode} from './ASTCCompilerNode';
import {ASTCStorageClassSpecifiersList} from './ASTCStorageClassSpecifiersList';
import {ASTCTypeQualifiersList} from './ASTCTypeQualifiersList';
import {ASTCTypeSpecifiersList} from './ASTCTypeSpecifiersList';
import {ASTCAlignmentSpecifiersList} from './ASTCAlignmentSpecifiersList';

@walkOverFields(
  {
    fields: [
      'storageClassSpecifiers',
      'typeSpecifiers',
      'typeQualifiers',
      'functionSpecifiers',
      'alignmentSpecifiers',
    ],
  },
)
export class ASTCDeclarationSpecifier extends ASTCCompilerNode {
  constructor(
    loc: NodeLocation,
    public readonly storageClassSpecifiers: ASTCStorageClassSpecifiersList,
    public readonly typeSpecifiers: ASTCTypeSpecifiersList,
    public readonly typeQualifiers: ASTCTypeQualifiersList,
    public readonly functionSpecifiers: ASTCFunctionSpecifiersList,
    public readonly alignmentSpecifiers: ASTCAlignmentSpecifiersList,
  ) {
    super(ASTCCompilerKind.ParameterDeclarationSpecifier, loc);
  }

  dropEmpty(): ASTCDeclarationSpecifier {
    const {
      loc,
      functionSpecifiers, storageClassSpecifiers,
      typeSpecifiers, typeQualifiers,
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
