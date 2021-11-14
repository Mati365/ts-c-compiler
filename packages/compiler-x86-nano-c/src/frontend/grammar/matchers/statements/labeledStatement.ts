import {TokenType} from '@compiler/lexer/shared';
import {NodeLocation} from '@compiler/grammar/tree/NodeLocation';
import {CCompilerKeyword} from '@compiler/x86-nano-c/constants';

import {CGrammar} from '../shared';
import {
  ASTCCaseStatement,
  ASTCCompilerNode,
  ASTCDefaultCaseStatement,
  ASTCLabelStatement,
} from '../../../ast';

import {constantExpression} from '../expressions/constantExpression';

/**
 * labeled_statement
 *  : IDENTIFIER ':' statement
 *  | CASE constant_expression ':' statement
 *  | DEFAULT ':' statement
 *  ;
 *
 * @export
 * @param {CGrammar} grammar
 * @return {ASTCCompilerNode}
 */
export function labeledStatement(grammar: CGrammar): ASTCCompilerNode {
  const {g, statement} = grammar;

  return <ASTCCompilerNode> g.or(
    {
      label() {
        const name = g.nonIdentifierKeyword();
        g.terminalType(TokenType.COLON);

        return new ASTCLabelStatement(
          NodeLocation.fromTokenLoc(name.loc),
          name,
          statement(),
        );
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
    },
  );
}
