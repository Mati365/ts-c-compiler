import {NodeLocation} from '@compiler/grammar/tree/NodeLocation';
import {TokenType} from '@compiler/lexer/tokens';
import {CTypeQualifiers} from '@compiler/x86-nano-c/constants';
import {ASTCType} from '../../../ast';
import {CGrammar} from '../shared';

/**
 * Matches const/volatile
 *
 * type_qualifier: CONST | VOLATILE;
 *
 * @param {CGrammar} grammar
 * @param {boolean} optional
 */
function typeQualifier({g}: CGrammar, opitonal?: boolean) {
  const token = g.identifier(
    [
      CTypeQualifiers.CONST,
      CTypeQualifiers.VOLATILE,
    ],
    opitonal,
  );

  return token && CTypeQualifiers[token.upperText];
}

/**
 * Matches C type
 *
 * @todo
 *  - Add modifiers for primitive types, add pointers support
 *  - Handle void (*ptr)()
 *
 *  declarator
 *     : pointer direct_declarator
 *     | direct_declarator
 *     ;
 *
 *   direct_declarator
 *     : IDENTIFIER
 *     | '(' declarator ')'
 *     | direct_declarator '[' constant_expression ']'
 *     | direct_declarator '[' ']'
 *     | direct_declarator '(' parameter_type_list ')'
 *     | direct_declarator '(' identifier_list ')'
 *     | direct_declarator '(' ')'
 *     ;
 *
 *   pointer
 *     : '*'
 *     | '*' type_qualifier_list
 *     | '*' pointer
 *     | '*' type_qualifier_list pointer
 *     ;
 *
 * @returns {ASTCType}
 */
export function typeDeclaration(grammar: CGrammar): ASTCType {
  const {g} = grammar;

  const qualifier = typeQualifier(grammar, true);
  const token = g.match(
    {
      type: TokenType.KEYWORD,
    },
  );

  return new ASTCType(
    NodeLocation.fromTokenLoc(token.loc),
    token.text,
    qualifier,
  );
}
