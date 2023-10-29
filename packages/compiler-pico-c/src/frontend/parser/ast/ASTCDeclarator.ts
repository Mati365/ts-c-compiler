import { walkOverFields } from '@ts-c-compiler/grammar';

import { NodeLocation } from '@ts-c-compiler/grammar';
import { ASTCCompilerKind, ASTCCompilerNode } from './ASTCCompilerNode';
import { ASTCDirectDeclarator } from './ASTCDirectDeclarator';
import { ASTCPointer } from './ASTCPointer';

@walkOverFields({
  fields: ['pointer', 'directDeclarator'],
})
export class ASTCDeclarator extends ASTCCompilerNode {
  constructor(
    loc: NodeLocation,
    readonly pointer?: ASTCPointer,
    readonly directDeclarator?: ASTCDirectDeclarator,
  ) {
    super(ASTCCompilerKind.Declarator, loc);
  }

  isPointer() {
    return !!this.pointer;
  }
}
