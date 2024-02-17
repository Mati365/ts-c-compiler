import { Token } from '@ts-cc/lexer';
import { NodeLocation } from '@ts-cc/grammar';
import { ASTCCompilerKind } from './ASTCCompilerNode';
import { ASTCStructSpecifier } from './ASTCStructSpecifier';
import { ASTCStructDeclarationList } from './ASTCStructDeclarationList';

export class ASTCUnionSpecifier extends ASTCStructSpecifier {
  constructor(loc: NodeLocation, items: ASTCStructDeclarationList, name?: Token<string>) {
    super(loc, items, name, ASTCCompilerKind.UnionSpecifier);
  }
}
