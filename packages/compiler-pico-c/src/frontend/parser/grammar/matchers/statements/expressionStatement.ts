import { TokenType } from '@ts-cc/lexer';
import { CGrammar } from '../shared';
import { ASTCCompilerNode, ASTCExpressionStatement } from '../../../ast';

import { expression } from '../expressions/expression';

/**
 * expression_statement
 *  : ';'
 *  | expression ';'
 */
export function expressionStatement(grammar: CGrammar): ASTCExpressionStatement {
  const { g } = grammar;
  const node = <ASTCCompilerNode>g.try(() => {
    const expressionNode = expression(grammar);

    return new ASTCExpressionStatement(expressionNode.loc, expressionNode);
  });

  g.terminalType(TokenType.SEMICOLON);
  return node;
}
