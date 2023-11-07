import { empty } from '@ts-c-compiler/grammar';

import type { ASTCPreprocessorTreeNode } from 'frontend/preprocessor/ast';
import type { CPreprocessorGrammar } from '../CPreprocessorGrammar';

import { CPreprocessorIdentifier } from '../CPreprocessorIdentifiers';
import { elifMatcher } from './elifMatcher';

export const ifFalseStmtMatcher = (ctx: CPreprocessorGrammar) => {
  const { g, stmt } = ctx;

  return g.or({
    else: () => {
      g.identifier(CPreprocessorIdentifier.ELSE);
      return stmt();
    },
    elif: () => elifMatcher(ctx),
    empty,
  }) as ASTCPreprocessorTreeNode | null;
};
