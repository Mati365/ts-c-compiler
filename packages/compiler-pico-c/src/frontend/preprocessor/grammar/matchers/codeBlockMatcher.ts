import { pipe } from 'fp-ts/function';
import * as A from 'fp-ts/Array';

import { Token, TokenType } from '@ts-c-compiler/lexer';
import {
  NodeLocation,
  SyntaxError,
  fetchTokensUntil,
} from '@ts-c-compiler/grammar';

import { ASTCCodeBlockNode } from 'frontend/preprocessor/ast/ASTCCodeBlockNode';
import { isPreprocessorIdentifierLikeToken } from 'frontend/preprocessor/utils';

import type { CPreprocessorGrammar } from '../CPreprocessorGrammar';

export const codeBlockMatcher = ({
  g,
}: CPreprocessorGrammar): ASTCCodeBlockNode => {
  const tokens: Token[] = pipe(
    fetchTokensUntil(isPreprocessorIdentifierLikeToken, g),
    A.filter(token => token.type !== TokenType.EOL),
  );

  if (!tokens.length) {
    throw new SyntaxError();
  }

  return new ASTCCodeBlockNode(
    NodeLocation.fromTokenLoc(tokens[0].loc),
    tokens,
  );
};
