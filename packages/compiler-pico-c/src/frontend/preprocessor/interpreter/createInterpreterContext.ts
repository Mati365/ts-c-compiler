import { pipe } from 'fp-ts/function';
import * as E from 'fp-ts/Either';

import { unwrapEitherOrThrow } from '@ts-c-compiler/core';
import { Token } from '@ts-c-compiler/lexer';
import { CInterpreterContext, CInterpreterIncludeResolver } from './types';

import type { CPreprocessorMacro } from './types/CPreprocessorMacro';

import { clexer } from '../../parser/lexer/clexer';
import { evalTokens } from './evalTokens';

import { ExpressionResultTreeVisitor } from './ExpressionResultTreeVisitor';
import { CInternalCompilerFsResolver } from '../../../fs';
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

    evalExpression: expression =>
      new ExpressionResultTreeVisitor(ctx).visit(expression).value,

    includeFile: path => {
      pipe(
        E.Do,
        E.bind('resolverOutput', () =>
          pipe(
            new CInternalCompilerFsResolver().read()(path),
            E.fold(() => {
              if (!fsIncludeResolver) {
                throw new CPreprocessorError(
                  CPreprocessorErrorCode.CANNOT_INCLUDE_FILE,
                  null,
                  { name: path.filename },
                );
              }

              return fsIncludeResolver.read(currentFilePath)(path);
            }, E.right),
          ),
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
