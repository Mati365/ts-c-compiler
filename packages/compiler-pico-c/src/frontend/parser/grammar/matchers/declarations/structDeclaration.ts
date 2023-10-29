import { TokenType } from '@ts-c-compiler/lexer';

import { structDeclaratorList } from './structDeclarator';
import { staticAssertDeclaration } from './staticAssertDeclaration';

import { ASTCStructDeclaration } from '../../../ast';
import { CGrammar } from '../shared';

/**
 * struct_declaration
 *  : specifier_qualifier_list ';'
 *  | specifier_qualifier_list struct_declarator_list ';'
 *  | static_assert_declaration
 *  ;
 */
export function structDeclaration(grammar: CGrammar): ASTCStructDeclaration {
  const { g, qualifiersSpecifiers } = grammar;

  return <ASTCStructDeclaration>g.or({
    specifiersList() {
      const specifiersList = qualifiersSpecifiers();
      const declaratorList = g.try(() => structDeclaratorList(grammar));

      g.terminalType(TokenType.SEMICOLON);

      return new ASTCStructDeclaration(
        specifiersList.loc,
        specifiersList,
        declaratorList,
      );
    },
    asseration() {
      const asseration = staticAssertDeclaration(grammar);

      return new ASTCStructDeclaration(asseration.loc, null, null, asseration);
    },
  });
}
