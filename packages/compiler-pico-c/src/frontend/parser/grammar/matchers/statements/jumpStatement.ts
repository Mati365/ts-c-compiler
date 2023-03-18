import { TokenType } from '@compiler/lexer/shared';
import { NodeLocation } from '@compiler/grammar/tree/NodeLocation';
import { CCompilerKeyword } from '@compiler/pico-c/constants';
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
  const { g } = grammar;
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

      if (!grammar.parentNode.loopStmt) {
        throw new CGrammarError(
          CGrammarErrorCode.CONTINUE_STMT_NOT_WITHIN_LOOP_OR_SWITCH,
        );
      }

      return new ASTCContinueStatement(NodeLocation.fromTokenLoc(node.loc));
    },

    break() {
      const node = g.identifier(CCompilerKeyword.BREAK);

      if (!grammar.parentNode.loopStmt) {
        throw new CGrammarError(
          CGrammarErrorCode.BREAK_STMT_NOT_WITHIN_LOOP_OR_SWITCH,
        );
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
