import { NodeLocation } from '@ts-cc/grammar';
import { ASTCInitDeclarator } from './ASTCInitDeclarator';
import { ASTCCompilerKind, ASTCCompilerNode } from './ASTCCompilerNode';

export class ASTCInitDeclaratorList extends ASTCCompilerNode<ASTCInitDeclarator> {
  constructor(loc: NodeLocation, items: ASTCInitDeclarator[]) {
    super(ASTCCompilerKind.InitDeclaratorList, loc, items);
  }
}
