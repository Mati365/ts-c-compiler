import { CCompilerIdentifier } from '@compiler/pico-c/constants';
import { Grammar, GrammarInitializer } from '@compiler/grammar/Grammar';

import { ASTCCompilerKind } from '../ast/ASTCCompilerNode';

import {
  CGrammar,
  qualifiersSpecifiers,
  assignmentExpression,
  unaryExpression,
  declarator,
  abstractDeclarator,
  statement,
  translationUnit,
  initializer,
} from './matchers';

/**
 * @see {@link https://www.lysator.liu.se/c/ANSI-C-grammar-y.html}
 * @see {@link https://cs.wmich.edu/~gupta/teaching/cs4850/sumII06/The%20syntax%20of%20C%20in%20Backus-Naur%20form.htm}
 */
const compilerMatcher: GrammarInitializer<
  CCompilerIdentifier,
  ASTCCompilerKind
> = ({ g }) => {
  const grammar: CGrammar = {
    g,
    declarator: () => declarator(grammar),
    abstractDeclarator: () => abstractDeclarator(grammar),
    statement: () => statement(grammar),
    unaryExpression: () => unaryExpression(grammar),
    assignmentExpression: () => assignmentExpression(grammar),
    qualifiersSpecifiers: () => qualifiersSpecifiers(grammar),
    initializer: () => initializer(grammar),
  };

  return () => translationUnit(grammar);
};

export function createCCompilerGrammar() {
  return Grammar.build(
    {
      ignoreMatchCallNesting: true,
    },
    compilerMatcher,
  );
}
