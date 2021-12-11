import {walkOverFields} from '@compiler/grammar/decorators/walkOverFields';

import {NodeLocation} from '@compiler/grammar/tree/NodeLocation';
import {ASTCCompilerKind, ASTCCompilerNode} from './ASTCCompilerNode';
import {ASTCTypeQualifiersList} from './ASTCTypeQualifiersList';

/**
 * @see
 *  ASTCAbstractDeclarator
 *
 * @export
 * @class ASTCPointer
 * @extends {ASTCCompilerNode}
 */
@walkOverFields(
  {
    fields: [
      'typeQualifierList',
      'pointer',
    ],
  },
)
export class ASTCPointer extends ASTCCompilerNode {
  constructor(
    loc: NodeLocation,
    public readonly typeQualifierList?: ASTCTypeQualifiersList,
    public readonly pointer?: ASTCPointer,
  ) {
    super(ASTCCompilerKind.Pointer, loc);
  }
}
