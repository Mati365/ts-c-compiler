import { TokenType } from '@ts-c-compiler/lexer';
import { NodeLocation } from '@ts-c-compiler/grammar';
import { CCompilerKeyword } from '#constants';

import { CGrammar } from '../shared';
import {
  ASTCCaseStatement,
  ASTCCompilerNode,
  ASTCDefaultCaseStatement,
  ASTCLabelStatement,
} from '../../../ast';

import { constantExpression } from '../expressions/constantExpression';

/**
 * labeled_statement
 *  : IDENTIFIER ':'
 *  | CASE constant_expression ':' statement
 *  | DEFAULT ':' statement
 *  ;
 */
export function labeledStatement(grammar: CGrammar): ASTCCompilerNode {
  const { g, statement } = grammar;

  return <ASTCCompilerNode>g.or({
    label() {
      const name = g.nonIdentifierKeyword();
      g.terminalType(TokenType.COLON);

      return new ASTCLabelStatement(NodeLocation.fromTokenLoc(name.loc), name);
    },

    case() {
      const caseNode = g.identifier(CCompilerKeyword.CASE);
      const constantExpressionNode = constantExpression(grammar);

      g.terminalType(TokenType.COLON);

      return new ASTCCaseStatement(
        NodeLocation.fromTokenLoc(caseNode.loc),
        constantExpressionNode,
        statement(),
      );
    },

    default() {
      const defaultNode = g.identifier(CCompilerKeyword.DEFAULT);
      g.terminalType(TokenType.COLON);

      return new ASTCDefaultCaseStatement(
        NodeLocation.fromTokenLoc(defaultNode.loc),
        g.try(statement),
      );
    },
  });
}
