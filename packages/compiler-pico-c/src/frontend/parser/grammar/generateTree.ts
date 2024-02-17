import * as E from 'fp-ts/Either';
import { Token } from '@ts-cc/lexer';

import { ASTCTreeNode } from '../ast';
import { CGrammarError, CGrammarErrorCode } from './errors/CGrammarError';
import { createCCompilerGrammar } from './grammar';

/**
 * Generates C syntax AST tree
 */
export function generateTree(tokens: Token[]): ASTCTreeNode {
  return createCCompilerGrammar().process(tokens);
}

/**
 * Returns result monad from tree generator
 */
export function safeGenerateTree(
  tokens: Token[],
): E.Either<CGrammarError[], ASTCTreeNode> {
  try {
    return E.right(generateTree(tokens));
  } catch (e) {
    e.code = e.code ?? CGrammarErrorCode.SYNTAX_ERROR;

    return E.left([e]);
  }
}
