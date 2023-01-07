import { NodeLocation } from '@compiler/grammar/tree/NodeLocation';
import { ASTCCompilerKind, ASTCCompilerNode } from './ASTCCompilerNode';
import { ASTCStructDeclarator } from './ASTCStructDeclarator';

export class ASTCStructDeclaratorList extends ASTCCompilerNode<ASTCStructDeclarator> {
  constructor(loc: NodeLocation, items: ASTCStructDeclarator[]) {
    super(ASTCCompilerKind.StructDeclaratorList, loc, items);
  }
}
