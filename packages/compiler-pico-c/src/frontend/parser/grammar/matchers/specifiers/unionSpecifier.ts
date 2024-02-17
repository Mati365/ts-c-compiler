import { NodeLocation } from '@ts-cc/grammar';

import { CCompilerKeyword } from '#constants';
import {
  ASTCStructDeclarationList,
  ASTCStructSpecifier,
  ASTCUnionSpecifier,
} from '../../../ast';

import { CGrammar } from '../shared';
import { structDeclarationList } from '../declarations/structDeclarationList';

/**
 * union_specifier
 *  : union '{' struct_declaration_list '}'
 *  | union IDENTIFIER '{' struct_declaration_list '}'
 *  | union IDENTIFIER
 *  ;
 */
export function unionSpecifier(grammar: CGrammar): ASTCStructSpecifier {
  const { g } = grammar;
  const startToken = g.identifier(CCompilerKeyword.UNION);

  const name = g.try(() => g.nonIdentifierKeyword());
  let list: ASTCStructDeclarationList = null;

  if (g.currentToken.text === '{') {
    g.terminal('{');
    list = structDeclarationList(grammar);
    g.terminal('}');
  }

  return new ASTCUnionSpecifier(NodeLocation.fromTokenLoc(startToken.loc), list, name);
}
