import {Result, ok, err} from '@compiler/core/monads/Result';
import {Token} from '@compiler/lexer/tokens';
import {ASTCTreeNode} from '../ast';
import {CGrammarError, CGrammarErrorCode} from './errors/CGrammarError';
import {createCCompilerGrammar} from './grammar';

/**
 * Generates C syntax AST tree
 *
 * @export
 * @param {Token[]} tokens
 * @return {ASTCTreeNode}
 */
export function treeGenerate(tokens: Token[]): ASTCTreeNode {
  return createCCompilerGrammar().process(tokens);
}

/**
 * Returns result monad from tree generator
 *
 * @export
 * @param {Token[]} tokens
 * @return {Result<ASTCTreeNode, CGrammarError[]>}
 */
export function safeTreeGenerate(tokens: Token[]): Result<ASTCTreeNode, CGrammarError[]> {
  try {
    return ok(
      treeGenerate(tokens),
    );
  } catch (e) {
    e.code = e.code ?? CGrammarErrorCode.SYNTAX_ERROR;

    return err(
      [
        e,
      ],
    );
  }
}
