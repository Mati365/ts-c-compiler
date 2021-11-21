/* eslint-disable no-use-before-define, @typescript-eslint/no-use-before-define */
import {TokenType} from '@compiler/lexer/shared';
import {ASTCInitializer} from '@compiler/x86-nano-c/frontend/ast';
import {CGrammar} from '../shared';

import {assignmentExpression} from '../expressions/assignmentExpression';
import {fetchSplittedProductionsList} from '../utils';

/**
 * initializer_list
 *  : designation initializer
 *  | initializer
 *  | initializer_list ',' designation initializer
 *  | initializer_list ',' initializer
 *  ;
 *
 * @todo
 *  Add designation!
 *
 * @param {CGrammar} grammar
 * @return {ASTCInitializer[]}
 */
function initializerList(grammar: CGrammar): ASTCInitializer[] {
  return fetchSplittedProductionsList(
    grammar.g,
    () => initializer(grammar),
  );
}

/**
 * initializer
 *  : assignment_expression
 *  | '{' initializer_list '}'
 *  | '{' initializer_list ',' '}'
 *  ;
 *
 * @todo
 *  Add initializers list
 *
 * @export
 * @param {CGrammar} grammar
 * @return {ASTCInitializer}
 */
export function initializer(grammar: CGrammar): ASTCInitializer {
  const {g} = grammar;

  return <ASTCInitializer> g.or(
    {
      assignment() {
        const assignmentExpressionNode = assignmentExpression(grammar);

        return new ASTCInitializer(
          assignmentExpressionNode.loc,
          assignmentExpressionNode,
        );
      },

      initializerList() {
        g.terminal('{');

        const initializers = initializerList(grammar);

        g.match(
          {
            type: TokenType.COMMA,
            consume: true,
            optional: true,
          },
        );

        g.terminal('}');

        return new ASTCInitializer(
          initializers[0].loc,
          null,
          initializers,
        );
      },
    },
  );
}
