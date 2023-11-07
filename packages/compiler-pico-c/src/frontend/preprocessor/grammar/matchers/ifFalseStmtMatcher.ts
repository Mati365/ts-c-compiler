import { empty } from '@ts-c-compiler/grammar';

import type { ASTCPreprocessorTreeNode } from 'frontend/preprocessor/ast';
import type { CPreprocessorGrammar } from '../CPreprocessorGrammar';

import { CPreprocessorIdentifier } from '../CPreprocessorIdentifiers';
import { elifMatcher } from './elifMatcher';
import { elifDefMatcher } from './elifDefMatcher';
import { elifNotDefMatcher } from './elifNotDefMatcher';

export const ifFalseStmtMatcher = (ctx: CPreprocessorGrammar) => {
  const { g, stmt } = ctx;

  return g.or({
    else: () => {
      g.identifier(CPreprocessorIdentifier.ELSE);
      return stmt();
    },
    elifNotDef: () => elifNotDefMatcher(ctx),
    elifDef: () => elifDefMatcher(ctx),
    elif: () => elifMatcher(ctx),
    empty,
  }) as ASTCPreprocessorTreeNode | null;
};
