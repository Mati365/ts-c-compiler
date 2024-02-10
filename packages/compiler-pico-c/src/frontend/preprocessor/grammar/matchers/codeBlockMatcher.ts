import { pipe } from 'fp-ts/function';
import * as A from 'fp-ts/Array';

import { Token, TokenType } from '@ts-c-compiler/lexer';
import { NodeLocation, SyntaxError, fetchTokensUntil } from '@ts-c-compiler/grammar';

import { ASTCCodeBlockNode } from 'frontend/preprocessor/ast/ASTCCodeBlockNode';
import { isPreprocessorIdentifierLikeToken } from 'frontend/preprocessor/utils';

import type { CPreprocessorGrammar } from '../CPreprocessorGrammar';

export const codeBlockMatcher = ({ g }: CPreprocessorGrammar): ASTCCodeBlockNode => {
  const tokensWithEOLs: Token[] = fetchTokensUntil(
    isPreprocessorIdentifierLikeToken,
    g,
    true,
  );

  if (!tokensWithEOLs.length) {
    throw new SyntaxError();
  }

  const filteredTokens = pipe(
    tokensWithEOLs,
    A.filter(token => token.type !== TokenType.EOL),
  );

  if (!filteredTokens.length) {
    return new ASTCCodeBlockNode(NodeLocation.fromTokenLoc(tokensWithEOLs[0].loc), []);
  }

  return new ASTCCodeBlockNode(
    NodeLocation.fromTokenLoc(filteredTokens[0].loc),
    filteredTokens,
  );
};
