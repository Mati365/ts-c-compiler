/* eslint-disable no-use-before-define, @typescript-eslint/no-use-before-define */
import * as R from 'ramda';

import {TokenType} from '@compiler/lexer/shared';
import {SyntaxError} from '@compiler/grammar/Grammar';

import {CGrammar} from '../shared';
import {ASTCStructDeclaratorList, ASTCStructDeclarator} from '../../../ast';
import {constantExpression} from '../expressions/constantExpression';

/**
 * struct_declarator_list
 *  : struct_declarator
 *  | struct_declarator_list ',' struct_declarator
 *  ;
 *
 * @param {CGrammar} grammar
 * @return {ASTCStructDeclaratorList}
 */
export function structDeclaratorList(grammar: CGrammar): ASTCStructDeclaratorList {
  const {g} = grammar;
  const items: ASTCStructDeclarator[] = [];

  do {
    const result = <ASTCStructDeclarator> g.try(() => structDeclarator(grammar));
    if (!result)
      break;

    items.push(result);

    const comma = g.match(
      {
        type: TokenType.COMMA,
        optional: true,
      },
    );

    if (!comma)
      break;
  } while (true);

  if (R.isEmpty(items))
    throw new SyntaxError;

  return new ASTCStructDeclaratorList(items[0].loc, items);
}

/**
 * struct_declarator
 *  : ':' constant_expression
 *  | declarator ':' constant_expression
 *  | declarator
 *  ;
 *
 * @export
 * @param {CGrammar} grammar
 * @return {ASTCStructDeclarator}
 */
export function structDeclarator(grammar: CGrammar): ASTCStructDeclarator {
  const {g, declarator} = grammar;

  return <ASTCStructDeclarator> g.or(
    {
      colon() {
        g.terminalType(TokenType.COLON);
        const expression = constantExpression(grammar);

        return new ASTCStructDeclarator(expression.loc, null, expression);
      },
      declarator() {
        const declaratorNode = declarator();
        const expression = g.try(() => {
          g.terminalType(TokenType.COLON);

          return constantExpression(grammar);
        });

        return new ASTCStructDeclarator(declaratorNode.loc, declaratorNode, expression);
      },
    },
  );
}
