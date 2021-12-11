import {TokenType} from '@compiler/lexer/shared';
import {NodeLocation} from '@compiler/grammar/tree/NodeLocation';
import {CCompilerKeyword} from '@compiler/x86-nano-c/constants';
import {CGrammar} from '../shared';
import {
  ASTCCompilerNode,
  ASTCDoWhileStatement,
  ASTCWhileStatement,
  ASTCForStatement,
} from '../../../ast';

import {declaration} from '../declarations/declaration';
import {expression} from '../expressions/expression';
import {expressionStatement} from './expressionStatement';

/**
 * iteration_statement
 *  : WHILE '(' expression ')' statement
 *  | DO statement WHILE '(' expression ')' ';'
 *  | FOR '(' expression_statement expression_statement ')' statement
 *  | FOR '(' expression_statement expression_statement expression ')' statement
 *  | FOR '(' declaration expression_statement ')' statement
 *  | FOR '(' declaration expression_statement expression ')' statement
 *  ;
 *
 * @export
 * @param {CGrammar} grammar
 * @return {ASTCCompilerNode}
 */
export function iterationStatement(grammar: CGrammar): ASTCCompilerNode {
  const {g, statement} = grammar;

  return <ASTCCompilerNode> g.or(
    {
      while() {
        const startToken = g.identifier(CCompilerKeyword.WHILE);

        g.terminal('(');
        const expressionNode = expression(grammar);
        g.terminal(')');

        return new ASTCWhileStatement(
          NodeLocation.fromTokenLoc(startToken.loc),
          expressionNode,
          statement(),
        );
      },

      doWhile() {
        const startToken = g.identifier(CCompilerKeyword.DO);
        const statementNode = statement();

        g.identifier(CCompilerKeyword.WHILE);
        g.terminal('(');

        const expressionNode = expression(grammar);

        g.terminal(')');
        g.terminalType(TokenType.SEMICOLON);

        return new ASTCDoWhileStatement(
          NodeLocation.fromTokenLoc(startToken.loc),
          expressionNode,
          statementNode,
        );
      },

      for() {
        const startToken = g.identifier(CCompilerKeyword.FOR);
        g.terminal('(');

        let declarationNode: ASTCCompilerNode = g.try(() => declaration(grammar));
        let conditionNode: ASTCCompilerNode = null;
        let expressionNode: ASTCCompilerNode = null;

        if (declarationNode) {
          /**
           * FOR '(' declaration expression_statement ')' statement
           * FOR '(' declaration expression_statement expression ')' statement
           */
          conditionNode = expressionStatement(grammar);
          expressionNode = g.try(() => expression(grammar));
        } else {
          /**
           * FOR '(' expression_statement expression_statement ')' statement
           * FOR '(' expression_statement expression_statement expression ')' statement
           */
          declarationNode = expressionStatement(grammar);
          conditionNode = expressionStatement(grammar);
          expressionNode = g.try(() => expression(grammar));
        }

        g.terminal(')');

        return new ASTCForStatement(
          NodeLocation.fromTokenLoc(startToken.loc),
          statement(),
          declarationNode,
          conditionNode,
          expressionNode,
        );
      },
    },
  );
}
