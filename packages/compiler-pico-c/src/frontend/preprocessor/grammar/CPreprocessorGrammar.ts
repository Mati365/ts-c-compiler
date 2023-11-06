import { Grammar, GrammarInitializer, empty } from '@ts-c-compiler/grammar';
import {
  CPreprocessorIdentifier,
  C_PREPROCESSOR_IDENTIFIERS_MAP,
} from './CPreprocessorIdentifiers';

import {
  ASTCPreprocessorKind,
  ASTCPreprocessorTreeNode,
  ASTCStmtNode,
} from '../ast';

import {
  codeBlockMatcher,
  defineMatcher,
  ifDefMatcher,
  ifNotDefMatcher,
} from './matchers';

export class CPreprocessorGrammarDef extends Grammar<
  CPreprocessorIdentifier,
  ASTCPreprocessorKind
> {}

export type CPreprocessorGrammar = {
  g: CPreprocessorGrammarDef;
  stmt(): ASTCStmtNode;
};

const preprocessorMatcher: GrammarInitializer<
  CPreprocessorIdentifier,
  ASTCPreprocessorKind
> = ({ g }) => {
  const grammar: CPreprocessorGrammar = {
    g,
    stmt: () => {
      const children = g.matchList({
        ifDef: () => ifDefMatcher(grammar),
        ifNotDef: () => ifNotDefMatcher(grammar),
        define: () => defineMatcher(grammar),
        codeBlock: () => codeBlockMatcher(grammar),
        empty,
      }) as ASTCPreprocessorTreeNode[];

      return new ASTCStmtNode(children[0]?.loc, children);
    },
  };

  return grammar.stmt;
};

export const createCPreprocessorGrammar = () =>
  Grammar.build(
    {
      identifiers: C_PREPROCESSOR_IDENTIFIERS_MAP,
    },
    preprocessorMatcher,
  );
