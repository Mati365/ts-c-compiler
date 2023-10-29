import { NodeLocation } from '@ts-c-compiler/grammar';
import { ASTCStructDeclaration } from './ASTCStructDeclaration';
import { ASTCCompilerKind, ASTCCompilerNode } from './ASTCCompilerNode';

export class ASTCStructDeclarationList extends ASTCCompilerNode<ASTCStructDeclaration> {
  constructor(loc: NodeLocation, items: ASTCStructDeclaration[]) {
    super(ASTCCompilerKind.StructDeclarationList, loc, items);
  }
}
