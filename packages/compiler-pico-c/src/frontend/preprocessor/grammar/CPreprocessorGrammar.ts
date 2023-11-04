import { Grammar, GrammarInitializer } from '@ts-c-compiler/grammar';
import { CPreprocessorIdentifier } from './CPreprocessorIdentifiers';
import { ASTCPreprocessorKind } from '../ast';

export class CPreprocessorGrammarDef extends Grammar<
  CPreprocessorIdentifier,
  ASTCPreprocessorKind
> {}

export type CPreprocessorGrammar = {
  g: CPreprocessorGrammarDef;
};

const preprocessorMatcher: GrammarInitializer<
  CPreprocessorIdentifier,
  ASTCPreprocessorKind
> = ({ g }) => {
  const grammar: CPreprocessorGrammar = {
    g,
  };

  console.info(grammar);
  return () => null;
};

export const createCCompilerGrammar = () =>
  Grammar.build(
    {
      ignoreMatchCallNesting: true,
    },
    preprocessorMatcher,
  );
