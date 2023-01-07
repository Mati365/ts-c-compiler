import {
  CCOMPILER_TYPE_SPECIFIERS,
  CTypeSpecifier,
} from '@compiler/pico-c/constants';

import { Token } from '@compiler/lexer/tokens';
import { NodeLocation } from '@compiler/grammar/tree/NodeLocation';
import { ASTCTypeSpecifier } from '@compiler/pico-c/frontend/parser/ast';
import { CGrammar } from '../shared';

import { enumDeclarator } from '../declarations/enumDeclator';
import { structOrUnionSpecifier } from './structOrUnionSpecifier';

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
  const { g } = grammar;

  return <ASTCTypeSpecifier>g.or({
    identifier() {
      const identifierToken = <Token<string>>g.or({
        identifier: () => g.identifier(CCOMPILER_TYPE_SPECIFIERS),
        // typeName: () => g.nonIdentifierKeyword(),
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
  });
}
