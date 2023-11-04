import { Grammar, GrammarInitializer } from '@ts-c-compiler/grammar';
import {
  CPreprocessorIdentifier,
  C_PREPROCESSOR_IDENTIFIERS_MAP,
} from './CPreprocessorIdentifiers';

import { ASTCCodeBlockNode, ASTCPreprocessorKind } from '../ast';
import { codeBlockMatcher, defineMatcher } from './matchers';

export class CPreprocessorGrammarDef extends Grammar<
  CPreprocessorIdentifier,
  ASTCPreprocessorKind
> {}

export type CPreprocessorGrammar = {
  g: CPreprocessorGrammarDef;
  codeBlock(): ASTCCodeBlockNode;
};

const preprocessorMatcher: GrammarInitializer<
  CPreprocessorIdentifier,
  ASTCPreprocessorKind
> = ({ g }) => {
  const grammar: CPreprocessorGrammar = {
    g,
    codeBlock: () => codeBlockMatcher(grammar),
  };

  return () =>
    g.matchList({
      define: () => defineMatcher(grammar),
      codeBlock: () => codeBlockMatcher(grammar),
    });
};

export const createCPreprocessorGrammar = () =>
  Grammar.build(
    {
      ignoreMatchCallNesting: true,
      identifiers: C_PREPROCESSOR_IDENTIFIERS_MAP,
    },
    preprocessorMatcher,
  );
