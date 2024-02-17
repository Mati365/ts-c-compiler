import { TokenType } from '@ts-cc/lexer';
import { NodeLocation } from '@ts-cc/grammar';
import { CCompilerKeyword } from '#constants';
import { CGrammar } from '../shared';
import {
  ASTCCompilerNode,
  ASTCDoWhileStatement,
  ASTCWhileStatement,
  ASTCForStatement,
} from '../../../ast';

import { declaration } from '../declarations/declaration';
import { expression } from '../expressions/expression';
import { expressionStatement } from './expressionStatement';

/**
 * iteration_statement
 *  : WHILE '(' expression ')' statement
 *  | DO statement WHILE '(' expression ')' ';'
 *  | FOR '(' expression_statement expression_statement ')' statement
 *  | FOR '(' expression_statement expression_statement expression ')' statement
 *  | FOR '(' declaration expression_statement ')' statement
 *  | FOR '(' declaration expression_statement expression ')' statement
 *  ;
 */
export function iterationStatement(grammar: CGrammar): ASTCCompilerNode {
  const { g, statement, parentNode } = grammar;

  return <ASTCCompilerNode>g.or({
    while() {
      const startToken = g.identifier(CCompilerKeyword.WHILE);

      g.terminal('(');
      const expressionNode = expression(grammar);
      g.terminal(')');

      const whileStmt = new ASTCWhileStatement(
        NodeLocation.fromTokenLoc(startToken.loc),
        expressionNode,
        null,
      );

      (parentNode.loopStmt ??= []).push(whileStmt);
      whileStmt.statement = statement();
      parentNode.loopStmt.pop();

      return whileStmt;
    },

    doWhile() {
      const startToken = g.identifier(CCompilerKeyword.DO);
      const doWhileStmt = new ASTCDoWhileStatement(
        NodeLocation.fromTokenLoc(startToken.loc),
        null,
        null,
      );

      (parentNode.loopStmt ??= []).push(doWhileStmt);
      const statementNode = statement();
      parentNode.loopStmt.pop();

      g.identifier(CCompilerKeyword.WHILE);
      g.terminal('(');

      const expressionNode = expression(grammar);

      g.terminal(')');
      g.terminalType(TokenType.SEMICOLON);

      doWhileStmt.expression = expressionNode;
      doWhileStmt.statement = statementNode;

      return doWhileStmt;
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

      const forStmt = new ASTCForStatement(
        NodeLocation.fromTokenLoc(startToken.loc),
        null,
        declarationNode,
        conditionNode,
        expressionNode,
      );

      (parentNode.loopStmt ??= []).push(forStmt);
      forStmt.statement = statement();
      parentNode.loopStmt.pop();

      return forStmt;
    },
  });
}
