import {SyntaxError} from '@compiler/grammar/Grammar';
import {NodeLocation} from '@compiler/grammar/tree/NodeLocation';
import {
  ASTCDirectDeclarator,
  ASTCDirectDeclaratorFnExpression,
  ASTCDirectDeclaratorArrayExpression,
} from '@compiler/x86-nano-c/frontend/ast';

import {CGrammar} from '../shared';
import {parameterTypeList} from '../parameters/parameterTypeList';
import {assignmentExpression} from '../expressions/assignmentExpression';
import {typeQualifiers} from '../specifiers/typeQualifiers';

/**
 * | '(' declarator ')'
 * | direct_declarator '(' parameter_type_list ')'
 * | direct_declarator '(' identifier_list ')'
 * | direct_declarator '(' ')'
 *
 * @todo
 *  Add identifiers list!
 *
 * @param {CGrammar} grammar
 * @return {ASTCDirectDeclaratorFnExpression}
 */
function directDeclaratorFnExpression(grammar: CGrammar): ASTCDirectDeclaratorFnExpression {
  const {g} = grammar;

  const startTerminalLoc = NodeLocation.fromTokenLoc(g.terminal('(').loc);
  const expression = <ASTCDirectDeclaratorFnExpression> g.or(
    {
      typeList() {
        return new ASTCDirectDeclaratorFnExpression(
          startTerminalLoc,
          parameterTypeList(grammar),
        );
      },
      empty() {
        return new ASTCDirectDeclaratorFnExpression(startTerminalLoc);
      },
    },
  );

  g.terminal(')');

  return expression;
}

/**
 * | direct_declarator '[' ']'
 * | direct_declarator '[' '*' ']'
 * | direct_declarator '[' STATIC type_qualifier_list assignment_expression ']'
 * | direct_declarator '[' STATIC assignment_expression ']'
 * | direct_declarator '[' type_qualifier_list '*' ']'
 * | direct_declarator '[' type_qualifier_list STATIC assignment_expression ']'
 * | direct_declarator '[' type_qualifier_list assignment_expression ']'
 * | direct_declarator '[' type_qualifier_list ']'
 * | direct_declarator '[' assignment_expression ']'
 *
 * @param {CGrammar} grammar
 * @return {ASTCDirectDeclaratorArrayExpression}
 */
function directDeclaratorArrayExpression(grammar: CGrammar): ASTCDirectDeclaratorArrayExpression {
  const {g} = grammar;

  const startTerminalLoc = NodeLocation.fromTokenLoc(g.terminal('[').loc);
  const expression = <ASTCDirectDeclaratorArrayExpression> g.or(
    {
      empty() {
        return new ASTCDirectDeclaratorArrayExpression(
          startTerminalLoc,
        );
      },

      star() {
        g.terminal('*');

        return new ASTCDirectDeclaratorArrayExpression(
          startTerminalLoc,
          true,
        );
      },

      qualifiersAndAssign() {
        return new ASTCDirectDeclaratorArrayExpression(
          startTerminalLoc,
          false,
          g.try(() => typeQualifiers(grammar)),
          g.try(() => assignmentExpression(grammar)),
        );
      },
    },
  );
  g.terminal(']');

  return expression;
}

/**
 * direct_declarator
 *  : IDENTIFIER
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
    // eslint-disable-next-line no-loop-func
    const newDirectDeclaratorNode = g.try(() => <ASTCDirectDeclarator> g.or(
      {
        declarator() {
          g.terminal('(');
          const declaratorNode = declarator();
          g.terminal(')');

          return new ASTCDirectDeclarator(
            declaratorNode.loc,
            null,
            declaratorNode,
            null, null,
            directDeclaratorNode,
          );
        },

        identifier() {
          const identifier = g.nonIdentifierKeyword();

          return new ASTCDirectDeclarator(
            NodeLocation.fromTokenLoc(identifier.loc),
            identifier,
            null, null, null,
            directDeclaratorNode,
          );
        },

        fnExpression() {
          const fnExpression = directDeclaratorFnExpression(grammar);

          return new ASTCDirectDeclarator(
            fnExpression.loc,
            null, null,
            fnExpression,
            directDeclaratorNode,
          );
        },

        arrayExpression() {
          const arrayExpression = directDeclaratorArrayExpression(grammar);

          return new ASTCDirectDeclarator(
            arrayExpression.loc,
            null,
            arrayExpression,
            null,
            directDeclaratorNode,
          );
        },
      },
    ));

    if (!newDirectDeclaratorNode)
      break;

    directDeclaratorNode = newDirectDeclaratorNode;
  } while (true);

  if (!directDeclaratorNode)
    throw new SyntaxError;

  return directDeclaratorNode;
}
