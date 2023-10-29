import { CCOMPILER_TYPE_SPECIFIERS, CTypeSpecifier } from '#constants';

import { Token, TokenType } from '@ts-c-compiler/lexer';
import { NodeLocation } from '@ts-c-compiler/grammar';
import { ASTCTypeSpecifier } from 'frontend/parser/ast';
import { CGrammar } from '../shared';

import { enumDeclarator } from '../declarations/enumDeclator';
import { structOrUnionSpecifier } from './structOrUnionSpecifier';
import { SyntaxError } from '@ts-c-compiler/grammar';

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
    struct() {
      const structOrUnion = structOrUnionSpecifier(grammar);

      return new ASTCTypeSpecifier(
        structOrUnion.loc,
        null,
        null,
        null,
        structOrUnion,
      );
    },
    enum() {
      const enumSpecifier = enumDeclarator(grammar);

      return new ASTCTypeSpecifier(
        enumSpecifier.loc,
        null,
        null,
        enumSpecifier,
      );
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
        typedefEntry,
      );
    },
  });
}
