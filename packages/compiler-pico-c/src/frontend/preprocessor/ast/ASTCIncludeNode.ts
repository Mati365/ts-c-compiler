import { NodeLocation } from '@ts-cc/grammar';

import { CInterpreterContext, CInterpreterSourcePath } from '../interpreter';

import {
  ASTCPreprocessorKind,
  ASTCPreprocessorTreeNode,
} from './ASTCPreprocessorTreeNode';

export class ASTCIncludeNode extends ASTCPreprocessorTreeNode {
  constructor(
    loc: NodeLocation,
    readonly path: CInterpreterSourcePath,
  ) {
    super(ASTCPreprocessorKind.Include, loc);
  }

  override exec(ctx: CInterpreterContext): void {
    ctx.includeFile(this.path);
  }
}
