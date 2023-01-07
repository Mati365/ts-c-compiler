/* eslint-disable no-use-before-define, @typescript-eslint/no-use-before-define */
import { TokenType } from '@compiler/lexer/shared';
import { CGrammar } from '../shared';
import { ASTCStructDeclaratorList, ASTCStructDeclarator } from '../../../ast';

import { fetchSplittedProductionsList } from '../utils';
import { constantExpression } from '../expressions/constantExpression';

/**
 * struct_declarator_list
 *  : struct_declarator
 *  | struct_declarator_list ',' struct_declarator
 *  ;
 */
export function structDeclaratorList(
  grammar: CGrammar,
): ASTCStructDeclaratorList {
  const items = fetchSplittedProductionsList<ASTCStructDeclarator>({
    g: grammar.g,
    prodFn: () => structDeclarator(grammar),
  });

  return new ASTCStructDeclaratorList(items[0].loc, items);
}

/**
 * struct_declarator
 *  : ':' constant_expression
 *  | declarator ':' constant_expression
 *  | declarator
 *  ;
 */
export function structDeclarator(grammar: CGrammar): ASTCStructDeclarator {
  const { g, declarator } = grammar;

  return <ASTCStructDeclarator>g.or({
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

      return new ASTCStructDeclarator(
        declaratorNode.loc,
        declaratorNode,
        expression,
      );
    },
  });
}
