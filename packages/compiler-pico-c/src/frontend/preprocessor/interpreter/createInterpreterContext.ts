import { pipe } from 'fp-ts/function';
import * as E from 'fp-ts/Either';

import { unwrapEitherOrThrow } from '@ts-c-compiler/core';
import { Token } from '@ts-c-compiler/lexer';
import { CInterpreterContext, CInterpreterIncludeResolver } from './types';

import type { CPreprocessorMacro } from './types/CPreprocessorMacro';

import { clexer } from '../../parser/lexer/clexer';
import { evalTokens } from './evalTokens';

import { ExpressionResultTreeVisitor } from './ExpressionResultTreeVisitor';
import { CPreprocessorError, CPreprocessorErrorCode } from '../grammar';

export type CInterpreterScope = {
  macros: Record<string, CPreprocessorMacro>;
};

export type CContextCreatorConfig = {
  scope: CInterpreterScope;
  currentFilePath: string;
  fsIncludeResolver?: CInterpreterIncludeResolver;
  interpretIncludedTokens: (
    includedFilePath: string,
  ) => (tokens: Token[]) => Token[];
};

export const createInterpreterContext = ({
  scope,
  currentFilePath,
  interpretIncludedTokens,
  fsIncludeResolver,
}: CContextCreatorConfig) => {
  const reduced: Token[] = [];
  const ctx: CInterpreterContext = {
    evalTokens: evalTokens(scope),
    isDefined: (name: string) => name in scope.macros,
    defineMacro: (name: string, macro: CPreprocessorMacro) => {
      scope.macros[name] = macro;
    },
    appendFinalTokens: finalTokens => {
      reduced.push(...finalTokens);
    },
    evalExpression: expression => {
      const visitor = new ExpressionResultTreeVisitor(ctx);

      return visitor.visit(expression).value;
    },
    includeFile: path => {
      if (!fsIncludeResolver) {
        throw new CPreprocessorError(
          CPreprocessorErrorCode.CANNOT_INCLUDE_FILE,
          null,
          { name: path.filename },
        );
      }

      pipe(
        E.Do,
        E.bind('resolverOutput', () =>
          fsIncludeResolver.read(currentFilePath)(path),
        ),
        E.bindW('tokens', ({ resolverOutput }) =>
          clexer({})(resolverOutput.content),
        ),
        E.map(({ tokens, resolverOutput }) =>
          interpretIncludedTokens(resolverOutput.absolutePath)(tokens),
        ),
        unwrapEitherOrThrow,
        ctx.appendFinalTokens,
      );
    },
  };

  return {
    reduced,
    ctx,
  };
};
