import {CGrammar} from '../shared';
import {ASTCParameterDeclaration} from '../../../ast';

import {declarationSpecifiers} from '../specifiers/declarationSpecifiers';

/**
 * parameter_declaration
 *  : declaration_specifiers declarator
 *  | declaration_specifiers abstract_declarator
 *  | declaration_specifiers
 *  ;
 *
 * @todo
 *  Add abstract declarator
 *
 * @export
 * @param {CGrammar} grammar
 * @return {ASTCParametersList}
 */
export function parameterDeclaration(grammar: CGrammar): ASTCParameterDeclaration {
  const {g, declarator} = grammar;
  const specifier = declarationSpecifiers(grammar);

  return <ASTCParameterDeclaration> g.or(
    {
      declarator() {
        return new ASTCParameterDeclaration(
          specifier.loc,
          specifier,
          declarator(),
        );
      },
      empty() {
        return new ASTCParameterDeclaration(
          specifier.loc,
          specifier,
        );
      },
    },
  );
}
