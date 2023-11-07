import * as R from 'ramda';

import { Token, TokenType } from '@ts-c-compiler/lexer';
import { createCPreprocessorGrammar } from '../grammar';

import { ASTCPreprocessorTreeNode } from '../ast';
import { CPreprocessorConfig, CInterpreterContext } from './types';

import type { CPreprocessorMacro } from './types/CPreprocessorMacro';

import { evalTokens } from './evalTokens';
import { ExpressionResultTreeVisitor } from './ExpressionResultTreeVisitor';

export type CInterpreterScope = {
  macros: Record<string, CPreprocessorMacro>;
};

export const interpret = (config: CPreprocessorConfig) => (tokens: Token[]) => {
  const reduced: Token[] = [];
  const scope: CInterpreterScope = {
    macros: {},
  };

  const ctx: CInterpreterContext = {
    config,
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
  };

  const tree = createCPreprocessorGrammar().process(tokens)
    .children[0] as ASTCPreprocessorTreeNode;

  tree.exec(ctx);

  if (R.last(reduced)?.type !== TokenType.EOF) {
    reduced.push(new Token(TokenType.EOF, null, null, null));
  }

  return reduced;
};
