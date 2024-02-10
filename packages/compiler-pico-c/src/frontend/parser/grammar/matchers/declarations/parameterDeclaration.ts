import { CGrammar } from '../shared';
import { ASTCParameterDeclaration } from '../../../ast';

import { declarationSpecifiers } from '../specifiers/declarationSpecifiers';

/**
 * parameter_declaration
 *  : declaration_specifiers declarator
 *  | declaration_specifiers abstract_declarator
 *  | declaration_specifiers
 *  ;
 */
export function parameterDeclaration(grammar: CGrammar): ASTCParameterDeclaration {
  const { g, declarator, abstractDeclarator } = grammar;
  const specifiers = declarationSpecifiers(grammar);

  return <ASTCParameterDeclaration>g.or({
    declarator() {
      return new ASTCParameterDeclaration(specifiers.loc, specifiers, declarator());
    },
    abstractDeclarator() {
      return new ASTCParameterDeclaration(
        specifiers.loc,
        specifiers,
        abstractDeclarator(),
      );
    },
    empty() {
      return new ASTCParameterDeclaration(specifiers.loc, specifiers);
    },
  });
}
