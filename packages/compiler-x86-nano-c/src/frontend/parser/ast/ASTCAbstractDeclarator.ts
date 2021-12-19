import {walkOverFields} from '@compiler/grammar/decorators/walkOverFields';

import {NodeLocation} from '@compiler/grammar/tree/NodeLocation';
import {ASTCCompilerKind, ASTCCompilerNode} from './ASTCCompilerNode';
import {ASTCDirectDeclaratorArrayExpression} from './ASTCDirectDeclarator';
import {ASTCPointer} from './ASTCPointer';

@walkOverFields(
  {
    fields: [
      'pointer',
      'directAbstractDeclarator',
    ],
  },
)
export class ASTCAbstractDeclarator extends ASTCCompilerNode {
  constructor(
    loc: NodeLocation,
    public readonly pointer: ASTCPointer,
    public readonly directAbstractDeclarator?: ASTCDirectDeclaratorArrayExpression,
  ) {
    super(ASTCCompilerKind.AbstractDeclarator, loc);
  }

  isPointer() { return !!this.pointer; }
}
