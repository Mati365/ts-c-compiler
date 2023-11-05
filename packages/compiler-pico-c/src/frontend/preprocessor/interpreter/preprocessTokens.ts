import { Token } from '@ts-c-compiler/lexer';
import { createCPreprocessorGrammar } from '../grammar';

import { TreeNode, TreeVisitor } from '@ts-c-compiler/grammar';
import { ASTCPreprocessorTreeNode, isPreprocessorTreeNode } from '../ast';
import { CInterpreterContext } from './types/CPreprocessorInterpretable';

import type { CPreprocessorMacro } from './types/CPreprocessorMacro';
import { evalTokens } from './evalTokens';

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
    defineMacro: (name: string, macro: CPreprocessorMacro) => {
      scope.macros[name] = macro;
    },
    appendFinalTokens: finalTokens => {
      reduced.push(...finalTokens);
    },
  };

  const visitor = new (class extends TreeVisitor<ASTCPreprocessorTreeNode> {
    enter(node: TreeNode) {
      if (isPreprocessorTreeNode(node)) {
        node.exec(ctx);
      }
    }
  })();

  const tree = createCPreprocessorGrammar().process(
    tokens,
  ) as ASTCPreprocessorTreeNode;

  visitor.visit(tree);
  return reduced;
};
