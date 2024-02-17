import * as R from 'ramda';

import { Token, TokenType } from '@ts-cc/lexer';
import { createCPreprocessorGrammar } from '../grammar';

import { ASTCPreprocessorTreeNode } from '../ast';
import { CPreprocessorConfig } from './types';

import {
  createInterpreterContext,
  type CInterpreterScope,
} from './createInterpreterContext';

export type CPreprocessorInterpreter = (
  config: CPreprocessorConfig & {
    forwardedScope?: CInterpreterScope;
  },
) => (tokens: Token[]) => Token[];

export const interpret: CPreprocessorInterpreter =
  ({ forwardedScope, ...config } = {}) =>
  tokens => {
    const scope: CInterpreterScope = forwardedScope ?? {
      macros: {},
    };

    let { reduced, ctx } = createInterpreterContext({
      scope,
      currentFilePath: config.currentFilePath,
      fsIncludeResolver: config.fsIncludeResolver,
      interpretIncludedTokens: includedFilePath =>
        interpret({
          ...config,
          forwardedScope: scope,
          currentFilePath: includedFilePath,
        }),
    });

    const tree = createCPreprocessorGrammar().process(tokens)
      .children[0] as ASTCPreprocessorTreeNode;

    tree.exec(ctx);

    if (forwardedScope) {
      reduced = reduced.filter(token => token.type !== TokenType.EOF);
    } else if (R.last(reduced)?.type !== TokenType.EOF) {
      reduced.push(new Token(TokenType.EOF, null, null, null));
    }

    return reduced;
  };
