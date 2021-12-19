import {walkOverFields} from '@compiler/grammar/decorators/walkOverFields';

import {NodeLocation} from '@compiler/grammar/tree/NodeLocation';
import {ASTCCompilerKind, ASTCCompilerNode} from './ASTCCompilerNode';
import {ASTCDirectDeclarator} from './ASTCDirectDeclarator';
import {ASTCPointer} from './ASTCPointer';

/**
 * @export
 * @class ASTCDeclarator
 * @extends {ASTCCompilerNode}
 */
@walkOverFields(
  {
    fields: [
      'pointer',
      'directDeclarator',
    ],
  },
)
export class ASTCDeclarator extends ASTCCompilerNode {
  constructor(
    loc: NodeLocation,
    public readonly pointer?: ASTCPointer,
    public readonly directDeclarator?: ASTCDirectDeclarator,
  ) {
    super(ASTCCompilerKind.Declarator, loc);
  }

  isPointer() { return !!this.pointer; }
}
