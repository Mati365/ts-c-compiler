import { walkOverFields } from '@ts-c-compiler/grammar';

import { NodeLocation } from '@ts-c-compiler/grammar';
import { ASTCCompilerKind, ASTCCompilerNode } from './ASTCCompilerNode';
import { ASTCTypeQualifiersList } from './ASTCTypeQualifiersList';

/**
 * @see
 *  ASTCAbstractDeclarator
 */
@walkOverFields({
  fields: ['typeQualifierList', 'pointer'],
})
export class ASTCPointer extends ASTCCompilerNode {
  constructor(
    loc: NodeLocation,
    readonly typeQualifierList?: ASTCTypeQualifiersList,
    readonly pointer?: ASTCPointer,
  ) {
    super(ASTCCompilerKind.Pointer, loc);
  }
}
