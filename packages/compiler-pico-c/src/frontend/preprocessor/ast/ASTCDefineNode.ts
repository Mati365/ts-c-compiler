import { NodeLocation } from '@ts-c-compiler/grammar';
import type { Token } from '@ts-c-compiler/lexer';

import type { CInterpreterContext } from '../interpreter';
import {
  ASTCPreprocessorKind,
  ASTCPreprocessorTreeNode,
} from './ASTCPreprocessorTreeNode';

export type ASTCDefineArg = {
  name: string;
  va: boolean;
};

export class ASTCDefineNode extends ASTCPreprocessorTreeNode {
  constructor(
    loc: NodeLocation,
    readonly name: string,
    readonly args: ASTCDefineArg[],
    readonly expression: Token[],
  ) {
    super(ASTCPreprocessorKind.Define, loc);
  }

  override exec({ defineMacro }: CInterpreterContext): void {
    const { name, args, expression } = this;

    defineMacro(name, { args, expression });
  }
}
