import { NodeLocation } from '@ts-c/grammar';
import { SyntaxError } from '@ts-c/grammar';
import { CGrammar } from '../shared';
import {
  ASTCDirectAbstractDeclarator,
  ASTCDirectAbstractDeclaratorFnExpression,
  ASTCDirectAbstractDeclaratorArrayExpression,
  ASTCDirectDeclaratorArrayExpression,
} from '../../../ast';

import { parameterTypeList } from '../parameters/parameterTypeList';
import { assignmentExpression } from '../expressions/assignmentExpression';
import { typeQualifiers } from '../specifiers/typeQualifiers';

/**
 * : '(' abstract_declarator ')'
 * | '(' ')'
 * | '(' parameter_type_list ')'
 */
function directAbstractDeclaratorFnExpression(
  grammar: CGrammar,
): ASTCDirectAbstractDeclaratorFnExpression {
  const { g, abstractDeclarator } = grammar;

  const startTerminalLoc = NodeLocation.fromTokenLoc(g.terminal('(').loc);
  const expression = <ASTCDirectAbstractDeclaratorFnExpression>g.or({
    abstractDeclarator() {
      return new ASTCDirectAbstractDeclaratorFnExpression(
        startTerminalLoc,
        abstractDeclarator(),
      );
    },

    typeList() {
      return new ASTCDirectAbstractDeclaratorFnExpression(
        startTerminalLoc,
        null,
        parameterTypeList(grammar),
      );
    },

    empty() {
      return new ASTCDirectAbstractDeclaratorFnExpression(startTerminalLoc);
    },
  });
  g.terminal(')');

  return expression;
}

/**
 * | '[' ']'
 * | '[' '*' ']'
 * | '[' STATIC type_qualifier_list assignment_expression ']'
 * | '[' STATIC assignment_expression ']'
 * | '[' type_qualifier_list STATIC assignment_expression ']'
 * | '[' type_qualifier_list assignment_expression ']'
 * | '[' type_qualifier_list ']'
 * | '[' assignment_expression ']'
 *
 * @todo
 *  Add STATIC support
 */
function directAbstractDeclaratorArrayExpression(
  grammar: CGrammar,
): ASTCDirectDeclaratorArrayExpression {
  const { g } = grammar;

  const startTerminalLoc = NodeLocation.fromTokenLoc(g.terminal('[').loc);
  const expression = <ASTCDirectAbstractDeclaratorArrayExpression>g.or({
    star() {
      g.terminal('*');

      return new ASTCDirectAbstractDeclaratorArrayExpression(
        startTerminalLoc,
        true,
      );
    },

    qualifiersAndAssign() {
      return new ASTCDirectAbstractDeclaratorArrayExpression(
        startTerminalLoc,
        false,
        g.try(() => typeQualifiers(grammar)),
        g.try(() => assignmentExpression(grammar)),
      );
    },

    empty() {
      return new ASTCDirectAbstractDeclaratorArrayExpression(startTerminalLoc);
    },
  });
  g.terminal(']');

  return expression;
}

/**
 * direct_abstract_declarator
 *  : '(' abstract_declarator ')'
 *  | '[' ']'
 *  | '[' '*' ']'
 *  | '[' STATIC type_qualifier_list assignment_expression ']'
 *  | '[' STATIC assignment_expression ']'
 *  | '[' type_qualifier_list STATIC assignment_expression ']'
 *  | '[' type_qualifier_list assignment_expression ']'
 *  | '[' type_qualifier_list ']'
 *  | '[' assignment_expression ']'
 *  | direct_abstract_declarator '[' ']'
 *  | direct_abstract_declarator '[' '*' ']'
 *  | direct_abstract_declarator '[' STATIC type_qualifier_list assignment_expression ']'
 *  | direct_abstract_declarator '[' STATIC assignment_expression ']'
 *  | direct_abstract_declarator '[' type_qualifier_list assignment_expression ']'
 *  | direct_abstract_declarator '[' type_qualifier_list STATIC assignment_expression ']'
 *  | direct_abstract_declarator '[' type_qualifier_list ']'
 *  | direct_abstract_declarator '[' assignment_expression ']'
 *  | '(' ')'
 *  | '(' parameter_type_list ')'
 *  | direct_abstract_declarator '(' ')'
 *  | direct_abstract_declarator '(' parameter_type_list ')'
 *  ;
 */
export function directAbstractDeclarator(
  grammar: CGrammar,
): ASTCDirectAbstractDeclarator {
  const { g } = grammar;
  let directDeclaratorNode: ASTCDirectAbstractDeclarator = null;

  // direct_abstract_declarator *, array
  do {
    const newDirectDeclaratorNode = g.try(
      // eslint-disable-next-line @typescript-eslint/no-loop-func
      () => <ASTCDirectAbstractDeclarator>g.or({
          fnExpression() {
            const fnExpression = directAbstractDeclaratorFnExpression(grammar);

            return new ASTCDirectAbstractDeclarator(
              fnExpression.loc,
              null,
              fnExpression,
              directDeclaratorNode,
            );
          },

          arrayExpression() {
            const arrayExpression =
              directAbstractDeclaratorArrayExpression(grammar);

            return new ASTCDirectAbstractDeclarator(
              arrayExpression.loc,
              arrayExpression,
              null,
              directDeclaratorNode,
            );
          },
        }),
    );

    if (!newDirectDeclaratorNode) {
      break;
    }

    directDeclaratorNode = newDirectDeclaratorNode;
  } while (true);

  if (!directDeclaratorNode) {
    throw new SyntaxError();
  }

  return directDeclaratorNode;
}
