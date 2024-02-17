import { TokenType } from '@ts-cc/lexer';
import { NodeLocation } from '@ts-cc/grammar';
import { CCompilerKeyword } from '#constants';
import { CGrammar } from '../shared';

import { CGrammarError, CGrammarErrorCode } from '../../errors/CGrammarError';
import {
  ASTCCompilerNode,
  ASTCBreakStatement,
  ASTCContinueStatement,
  ASTCGotoStatement,
  ASTCReturnStatement,
} from '../../../ast';

import { expression } from '../expressions/expression';

/**
 * jump_statement
 *  : GOTO IDENTIFIER ';'
 *  | CONTINUE ';'
 *  | BREAK ';'
 *  | RETURN ';'
 *  | RETURN expression ';'
 *  ;
 */
export function jumpStatement(grammar: CGrammar): ASTCCompilerNode {
  const { g, parentNode } = grammar;
  const jumpNode = <ASTCCompilerNode>g.or({
    goto() {
      const node = g.identifier(CCompilerKeyword.GOTO);

      return new ASTCGotoStatement(
        NodeLocation.fromTokenLoc(node.loc),
        g.nonIdentifierKeyword(),
      );
    },

    continue() {
      const node = g.identifier(CCompilerKeyword.CONTINUE);

      if (!parentNode.loopStmt?.length) {
        throw new CGrammarError(CGrammarErrorCode.CONTINUE_STMT_NOT_WITHIN_LOOP);
      }

      return new ASTCContinueStatement(NodeLocation.fromTokenLoc(node.loc));
    },

    break() {
      const node = g.identifier(CCompilerKeyword.BREAK);

      if (!parentNode.loopStmt && !parentNode.switchStmt?.length) {
        throw new CGrammarError(CGrammarErrorCode.BREAK_STMT_NOT_WITHIN_LOOP_OR_SWITCH);
      }

      return new ASTCBreakStatement(NodeLocation.fromTokenLoc(node.loc));
    },

    return() {
      const node = g.identifier(CCompilerKeyword.RETURN);

      return new ASTCReturnStatement(
        NodeLocation.fromTokenLoc(node.loc),
        g.try(() => expression(grammar)),
      );
    },
  });

  g.terminalType(TokenType.SEMICOLON);
  return jumpNode;
}
