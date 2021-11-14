import {Token} from '@compiler/lexer/tokens';
import {NodeLocation} from '@compiler/grammar/tree/NodeLocation';
import {ASTCInitDeclarator} from './ASTCInitDeclarator';
import {ASTCCompilerKind} from './ASTCCompilerNode';
import {ASTCStructSpecifier} from './ASTCStructSpecifier';

export class ASTCUnionSpecifier extends ASTCStructSpecifier {
  constructor(
    loc: NodeLocation,
    items: ASTCInitDeclarator[],
    name?: Token<string>,
  ) {
    super(loc, items, name, ASTCCompilerKind.UnionSpecifier);
  }
}
