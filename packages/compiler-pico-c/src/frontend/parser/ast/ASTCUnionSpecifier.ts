import { Token } from '@compiler/lexer/tokens';
import { NodeLocation } from '@compiler/grammar/tree/NodeLocation';
import { ASTCCompilerKind } from './ASTCCompilerNode';
import { ASTCStructSpecifier } from './ASTCStructSpecifier';
import { ASTCStructDeclarationList } from './ASTCStructDeclarationList';

export class ASTCUnionSpecifier extends ASTCStructSpecifier {
  constructor(
    loc: NodeLocation,
    items: ASTCStructDeclarationList,
    name?: Token<string>,
  ) {
    super(loc, items, name, ASTCCompilerKind.UnionSpecifier);
  }
}
