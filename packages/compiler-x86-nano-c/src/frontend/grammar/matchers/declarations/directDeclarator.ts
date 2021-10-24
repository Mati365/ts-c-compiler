import {NodeLocation} from '@compiler/grammar/tree/NodeLocation';
import {TokenType} from '@compiler/lexer/shared';
import {ASTCDirectDeclarator} from '@compiler/x86-nano-c/frontend/ast';
import {CGrammar} from '../shared';

/**
 * direct_declarator
 *  : IDENTIFIER
 *  | '(' declarator ')'
 *  | direct_declarator '[' constant_expression ']'
 *  | direct_declarator '[' ']'
 *  | direct_declarator '(' parameter_type_list ')'
 *  | direct_declarator '(' identifier_list ')'
 *  | direct_declarator '(' ')'
 *  ;
 *
 * @todo
 *  Add other than identifier!
 *
 * @export
 * @param {CGrammar} grammar
 * @return {ASTCDirectDeclarator}
 */
export function directDeclarator(grammar: CGrammar): ASTCDirectDeclarator {
  const {g} = grammar;
  const identifier = g.match(
    {
      type: TokenType.KEYWORD,
    },
  );

  return new ASTCDirectDeclarator(
    NodeLocation.fromTokenLoc(identifier.loc),
    identifier,
  );
}
