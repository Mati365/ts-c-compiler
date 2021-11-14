import {empty} from '@compiler/grammar/matchers';

import {SyntaxError} from '@compiler/grammar/Grammar';
import {NodeLocation} from '@compiler/grammar/tree/NodeLocation';
import {
  ASTCDirectDeclarator,
  ASTCDirectDeclaratorFnExpression,
} from '@compiler/x86-nano-c/frontend/ast';

import {CGrammar} from '../shared';
import {parameterTypeList} from '../parameters/parameterTypeList';

/**
 * | direct_declarator '(' parameter_type_list ')'
 * | direct_declarator '(' identifier_list ')'
 * | direct_declarator '(' ')'
 *
 * @param {CGrammar} grammar
 * @return {ASTCDirectDeclaratorFnExpression}
 */
function directDeclaratorFnExpression(grammar: CGrammar): ASTCDirectDeclaratorFnExpression {
  const {g} = grammar;
  let expression: ASTCDirectDeclaratorFnExpression = null;

  g.terminal('(');
  expression = <ASTCDirectDeclaratorFnExpression> g.or(
    {
      typeList() {
        const parameterTypeListNode = parameterTypeList(grammar);

        return new ASTCDirectDeclaratorFnExpression(
          parameterTypeListNode.loc,
          parameterTypeListNode,
        );
      },
      empty,
    },
  );
  g.terminal(')');

  return expression;
}

/**
 * direct_declarator
 *  : IDENTIFIER
 *  | '(' declarator ')'
 *  | direct_declarator '[' ']'
 *  | direct_declarator '[' '*' ']'
 *  | direct_declarator '[' STATIC type_qualifier_list assignment_expression ']'
 *  | direct_declarator '[' STATIC assignment_expression ']'
 *  | direct_declarator '[' type_qualifier_list '*' ']'
 *  | direct_declarator '[' type_qualifier_list STATIC assignment_expression ']'
 *  | direct_declarator '[' type_qualifier_list assignment_expression ']'
 *  | direct_declarator '[' type_qualifier_list ']'
 *  | direct_declarator '[' assignment_expression ']'
 *  | direct_declarator '(' parameter_type_list ')'
 *  | direct_declarator '(' identifier_list ')'
 *  | direct_declarator '(' ')'
 *  ;
 *
 * @todo
 *  Add other than identifier and function!
 *
 * @export
 * @param {CGrammar} grammar
 * @return {ASTCDirectDeclarator}
 */
export function directDeclarator(grammar: CGrammar): ASTCDirectDeclarator {
  const {g, declarator} = grammar;
  let directDeclaratorNode: ASTCDirectDeclarator = null;

  do {
    let newDirectDeclaratorNode = g.try(() => <ASTCDirectDeclarator> g.or(
      {
        identifier() {
          const identifier = g.nonIdentifierKeyword();

          return new ASTCDirectDeclarator(
            NodeLocation.fromTokenLoc(identifier.loc),
            identifier,
          );
        },

        declarator() {
          g.terminal('(');
          const declaratorNode = declarator();
          g.terminal(')');

          return new ASTCDirectDeclarator(
            declaratorNode.loc,
            null,
            declaratorNode,
          );
        },
      },
    ));

    if (!newDirectDeclaratorNode)
      break;

    // handles ()
    const arrayExpression = g.try(() => directDeclaratorFnExpression(grammar));
    if (arrayExpression) {
      newDirectDeclaratorNode = new ASTCDirectDeclarator(
        arrayExpression.loc,
        null, null,
        arrayExpression,
        null,
        newDirectDeclaratorNode,
      );
    }

    directDeclaratorNode = newDirectDeclaratorNode;
  } while (true);

  if (!directDeclaratorNode)
    throw new SyntaxError;

  return directDeclaratorNode;
}
