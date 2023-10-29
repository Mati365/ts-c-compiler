/* eslint-disable no-use-before-define, @typescript-eslint/no-use-before-define */
import { TokenType } from '@ts-c/lexer';
import { ASTCInitializer } from 'frontend/parser/ast';
import { NodeLocation } from '@ts-c/grammar';
import { CGrammar } from '../shared';

import { assignmentExpression } from '../expressions/assignmentExpression';
import { fetchSplittedProductionsList } from '../utils';
import { designation } from './designation';

/**
 * initializer_list
 *  : designation initializer
 *  | initializer
 *  | initializer_list ',' designation initializer
 *  | initializer_list ',' initializer
 *  ;
 */
function initializerList(grammar: CGrammar): ASTCInitializer[] {
  return fetchSplittedProductionsList({
    g: grammar.g,
    throwIfEmpty: false,
    prodFn: () => initializer(grammar),
  });
}

/**
 * initializer
 *  : assignment_expression
 *  | '{' initializer_list '}'
 *  | '{' initializer_list ',' '}'
 *  ;
 */
export function initializer(grammar: CGrammar): ASTCInitializer {
  const { g } = grammar;
  const designationNode = g.try(() => designation(grammar));

  return <ASTCInitializer>g.or({
    assignment() {
      const assignmentExpressionNode = assignmentExpression(grammar);

      return new ASTCInitializer(
        assignmentExpressionNode.loc,
        assignmentExpressionNode,
        null,
        designationNode,
      );
    },

    initializerList() {
      const startToken = g.terminal('{');
      const initializers = initializerList(grammar);

      g.match({
        type: TokenType.COMMA,
        consume: true,
        optional: true,
      });

      g.terminal('}');

      return new ASTCInitializer(
        NodeLocation.fromTokenLoc(startToken.loc),
        null,
        initializers,
        designationNode,
      );
    },
  });
}
