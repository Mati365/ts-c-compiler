import { pipe } from 'fp-ts/function';

import { TokenType, joinTokensWithSpaces } from '@ts-c-compiler/lexer';
import { NodeLocation, fetchTokensUntilTokenType } from '@ts-c-compiler/grammar';

import type { CPreprocessorGrammar } from '../CPreprocessorGrammar';

import { CPreprocessorIdentifier } from '../CPreprocessorIdentifiers';
import { ASTCIncludeNode } from 'frontend/preprocessor/ast';

export const includeMatcher = (ctx: CPreprocessorGrammar): ASTCIncludeNode => {
  const { g } = ctx;
  const identifier = g.identifier(CPreprocessorIdentifier.INCLUDE);
  const loc = NodeLocation.fromTokenLoc(identifier.loc);

  return g.or({
    local: () => {
      const filename = g.terminalType(TokenType.QUOTE);

      return new ASTCIncludeNode(loc, {
        system: false,
        filename: filename.text,
      });
    },

    system: () => {
      g.terminalType(TokenType.LESS_THAN);

      const filename = pipe(
        fetchTokensUntilTokenType(TokenType.GREATER_THAN, g),
        tokens => joinTokensWithSpaces(tokens, true),
      );

      return new ASTCIncludeNode(loc, {
        system: true,
        filename,
      });
    },
  }) as ASTCIncludeNode;
};
