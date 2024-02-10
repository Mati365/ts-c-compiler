import { Grammar, GrammarInitializer, empty } from '@ts-c-compiler/grammar';
import {
  CPreprocessorIdentifier,
  C_PREPROCESSOR_IDENTIFIERS_MAP,
} from './CPreprocessorIdentifiers';

import { ASTCPreprocessorKind, ASTCPreprocessorTreeNode, ASTCStmtNode } from '../ast';

import {
  codeBlockMatcher,
  defineMatcher,
  ifDefMatcher,
  ifMatcher,
  ifNotDefMatcher,
  ifFalseStmtMatcher,
  includeMatcher,
} from './matchers';

export class CPreprocessorGrammarDef extends Grammar<
  CPreprocessorIdentifier,
  ASTCPreprocessorKind
> {}

export type CPreprocessorGrammar = {
  g: CPreprocessorGrammarDef;
  stmt(): ASTCStmtNode;
  falseIfStmt(): ASTCPreprocessorTreeNode;
};

const preprocessorMatcher: GrammarInitializer<
  CPreprocessorIdentifier,
  ASTCPreprocessorKind
> = ({ g }) => {
  const grammar: CPreprocessorGrammar = {
    g,
    falseIfStmt: () => ifFalseStmtMatcher(grammar),
    stmt: () => {
      const children = g.matchList({
        if: () => ifMatcher(grammar),
        ifDef: () => ifDefMatcher(grammar),
        ifNotDef: () => ifNotDefMatcher(grammar),
        define: () => defineMatcher(grammar),
        codeBlock: () => codeBlockMatcher(grammar),
        include: () => includeMatcher(grammar),
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
