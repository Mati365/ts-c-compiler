import { NodeLocation } from '@ts-c-compiler/grammar';

import { CCompilerKeyword } from '#constants';
import { ASTCStructDeclarationList, ASTCStructSpecifier } from '../../../ast';

import { CGrammar } from '../shared';
import { structDeclarationList } from '../declarations/structDeclarationList';

/**
 * struct_specifier
 *  : struct '{' struct_declaration_list '}'
 *  | struct IDENTIFIER '{' struct_declaration_list '}'
 *  | struct IDENTIFIER
 *  ;
 */
export function structSpecifier(grammar: CGrammar): ASTCStructSpecifier {
  const { g } = grammar;
  const startToken = g.identifier(CCompilerKeyword.STRUCT);

  const name = g.try(() => g.nonIdentifierKeyword());
  let list: ASTCStructDeclarationList = null;

  if (g.currentToken.text === '{') {
    g.terminal('{');
    list = structDeclarationList(grammar);
    g.terminal('}');
  }

  return new ASTCStructSpecifier(NodeLocation.fromTokenLoc(startToken.loc), list, name);
}
