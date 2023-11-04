import { NodeLocation } from '@ts-c-compiler/grammar';

import type { CInterpreterContext } from '../interpreter';
import {
  ASTCPreprocessorKind,
  ASTCPreprocessorTreeNode,
} from './ASTCPreprocessorTreeNode';

export class ASTCDefineNode extends ASTCPreprocessorTreeNode {
  constructor(
    loc: NodeLocation,
    readonly name: string,
    readonly args: string[],
    readonly expression: string,
  ) {
    super(ASTCPreprocessorKind.Define, loc);
  }

  override exec({ interpreter }: CInterpreterContext): void {
    const { name, args, expression } = this;

    interpreter.defineMacro(name, { args, expression });
  }
}
