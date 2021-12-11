/* eslint-disable no-use-before-define, @typescript-eslint/no-use-before-define */
import {TokenType} from '@compiler/lexer/shared';
import {ASTCInitializer} from '@compiler/x86-nano-c/frontend/parser/ast';
import {CGrammar} from '../shared';

import {assignmentExpression} from '../expressions/assignmentExpression';
import {fetchSplittedProductionsList} from '../utils';
import {designation} from './designation';

/**
 * initializer_list
 *  : designation initializer
 *  | initializer
 *  | initializer_list ',' designation initializer
 *  | initializer_list ',' initializer
 *  ;

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
 * @export
 * @param {CGrammar} grammar
 * @return {ASTCInitializer}
 */
export function initializer(grammar: CGrammar): ASTCInitializer {
  const {g} = grammar;
  const designationNode = g.try(() => designation(grammar));

  return <ASTCInitializer> g.or(
    {
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
          designationNode,
        );
      },
    },
  );
}
