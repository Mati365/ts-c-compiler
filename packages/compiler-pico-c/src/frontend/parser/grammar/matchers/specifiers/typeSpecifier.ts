import { CCOMPILER_TYPE_SPECIFIERS, CTypeSpecifier } from '#constants';

import { Token, TokenType } from '@ts-cc/lexer';
import { NodeLocation } from '@ts-cc/grammar';
import { SyntaxError } from '@ts-cc/grammar';

import { ASTCTypeSpecifier } from 'frontend/parser/ast';
import { CGrammar } from '../shared';

import { enumDeclarator } from '../declarations/enumDeclator';
import { structSpecifier } from './structSpecifier';
import { unionSpecifier } from './unionSpecifier';

/**
 * type_specifier
 *  : VOID
 *  | CHAR
 *  | SHORT
 *  | INT
 *  | LONG
 *  | FLOAT
 *  | DOUBLE
 *  | SIGNED
 *  | UNSIGNED
 *  | struct_or_union_specifier
 *  | enum_specifier
 *  | TYPE_NAME
 *  ;
 */
export function typeSpecifier(grammar: CGrammar): ASTCTypeSpecifier {
  const { g, getTypedefEntry } = grammar;

  return <ASTCTypeSpecifier>g.or({
    identifier() {
      const identifierToken = <Token<string>>g.or({
        identifier: () => g.identifier(CCOMPILER_TYPE_SPECIFIERS),
      });

      return new ASTCTypeSpecifier(
        NodeLocation.fromTokenLoc(identifierToken.loc),
        identifierToken.text as CTypeSpecifier,
      );
    },
    union() {
      const union = unionSpecifier(grammar);

      return new ASTCTypeSpecifier(union.loc, null, null, null, null, union);
    },
    struct() {
      const struct = structSpecifier(grammar);

      return new ASTCTypeSpecifier(struct.loc, null, null, null, struct);
    },
    enum() {
      const enumSpecifier = enumDeclarator(grammar);

      return new ASTCTypeSpecifier(enumSpecifier.loc, null, null, enumSpecifier);
    },
    typedef() {
      const nameToken = g.match({
        type: TokenType.KEYWORD,
      });

      const typedefEntry = getTypedefEntry(nameToken.text);
      if (!typedefEntry) {
        throw new SyntaxError();
      }

      return new ASTCTypeSpecifier(
        NodeLocation.fromTokenLoc(nameToken.loc),
        null,
        null,
        null,
        null,
        null,
        typedefEntry,
      );
    },
  });
}
