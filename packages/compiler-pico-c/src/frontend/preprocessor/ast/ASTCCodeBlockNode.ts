import { pipe } from 'fp-ts/function';

import { Token } from '@ts-cc/lexer';
import { NodeLocation } from '@ts-cc/grammar';

import { CInterpreterContext } from '../interpreter';
import {
  ASTCPreprocessorKind,
  ASTCPreprocessorTreeNode,
} from './ASTCPreprocessorTreeNode';

export class ASTCCodeBlockNode extends ASTCPreprocessorTreeNode {
  constructor(
    loc: NodeLocation,
    readonly content: Token[],
  ) {
    super(ASTCPreprocessorKind.CodeBlock, loc);
  }

  override exec({ appendFinalTokens, evalTokens }: CInterpreterContext): void {
    pipe(this.content, evalTokens, appendFinalTokens);
  }
}
