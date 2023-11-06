import * as R from 'ramda';

import { Token, TokenType } from '@ts-c-compiler/lexer';
import { createCPreprocessorGrammar } from '../grammar';

import { ASTCPreprocessorTreeNode } from '../ast';
import { CInterpreterContext } from './types/CPreprocessorInterpretable';

import type { CPreprocessorMacro } from './types/CPreprocessorMacro';

import { evalTokens } from './evalTokens';
import { ExpressionResultTreeVisitor } from './ExpressionResultTreeVisitor';

export type CPreprocessorScope = {
  macros: Record<string, CPreprocessorMacro>;
};

export const preprocessTokens = (tokens: Token[]) => {
  const reduced: Token[] = [];
  const scope: CPreprocessorScope = {
    macros: {},
  };

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
  };

  const tree = createCPreprocessorGrammar().process(tokens)
    .children[0] as ASTCPreprocessorTreeNode;

  tree.exec(ctx);

  if (R.last(reduced)?.type !== TokenType.EOF) {
    reduced.push(new Token(TokenType.EOF, null, null, null));
  }

  return reduced;
};
