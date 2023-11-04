import { Token } from '@ts-c-compiler/lexer';
import { createCPreprocessorGrammar } from '../grammar';

import { TreeNode, TreeVisitor } from '@ts-c-compiler/grammar';
import { ASTCPreprocessorTreeNode, isPreprocessorTreeNode } from '../ast';
import { CInterpreterContext } from './CPreprocessorInterpretable';

import type { CPreprocessorMacro } from './CPreprocessorMacro';

export type CPreprocessorState = {
  macros: [string, CPreprocessorMacro][];
  reducedTokens: Token[];
};

export class CPreprocessorInterpreter {
  private state: CPreprocessorState;

  reduce(tokens: Token[]): Token[] {
    const tree = createCPreprocessorGrammar().process(
      tokens,
    ) as ASTCPreprocessorTreeNode;

    return this.interpret(tree);
  }

  appendParsedTokens(tokens: Token[]) {
    this.state.reducedTokens.push(...tokens);
  }

  defineMacro(name: string, macro: CPreprocessorMacro) {
    this.state.macros.push([name, macro]);
  }

  private interpret(tree: ASTCPreprocessorTreeNode) {
    this.state = {
      macros: [],
      reducedTokens: [],
    };

    const ctx: CInterpreterContext = {
      interpreter: this,
    };

    const visitor = new (class extends TreeVisitor<ASTCPreprocessorTreeNode> {
      enter(node: TreeNode) {
        if (isPreprocessorTreeNode(node)) {
          node.exec(ctx);
        }
      }
    })();

    visitor.visit(tree);
    return this.state.reducedTokens;
  }
}
