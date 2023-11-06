import { NodeLocation } from '@ts-c-compiler/grammar';

import { CInterpreterContext } from '../interpreter';
import {
  ASTCPreprocessorKind,
  ASTCPreprocessorTreeNode,
} from './ASTCPreprocessorTreeNode';

export class ASTCStmtNode extends ASTCPreprocessorTreeNode {
  constructor(loc: NodeLocation, children: ASTCPreprocessorTreeNode[]) {
    super(ASTCPreprocessorKind.Stmt, loc, children);
  }

  override exec(ctx: CInterpreterContext): void {
    for (const child of this.children) {
      child.exec(ctx);
    }
  }
}
