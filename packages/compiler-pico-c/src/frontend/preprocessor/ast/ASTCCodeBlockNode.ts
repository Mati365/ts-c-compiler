import { Token } from '@ts-c-compiler/lexer';
import { NodeLocation } from '@ts-c-compiler/grammar';

import { CInterpreterContext } from '../interpreter';
import {
  ASTCPreprocessorKind,
  ASTCPreprocessorTreeNode,
} from './ASTCPreprocessorTreeNode';

export class ASTCCodeBlockNode extends ASTCPreprocessorTreeNode {
  constructor(loc: NodeLocation, readonly content: Token[]) {
    super(ASTCPreprocessorKind.CodeBlock, loc);
  }

  override exec({ interpreter }: CInterpreterContext): void {
    interpreter.appendParsedTokens(this.content);
  }
}
