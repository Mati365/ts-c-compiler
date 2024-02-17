import { NodeLocation } from '@ts-cc/grammar';

import type { CInterpreterContext } from '../interpreter';
import type { ASTCStmtNode } from './ASTCStmtNode';
import {
  ASTCPreprocessorKind,
  ASTCPreprocessorTreeNode,
} from './ASTCPreprocessorTreeNode';

export class ASTCIfDefNode extends ASTCPreprocessorTreeNode {
  constructor(
    loc: NodeLocation,
    readonly macro: string,
    readonly trueStmt: ASTCStmtNode,
    readonly falseStmt?: ASTCStmtNode | null,
  ) {
    super(ASTCPreprocessorKind.IfDef, loc);
  }

  override exec(ctx: CInterpreterContext): void {
    if (ctx.isDefined(this.macro)) {
      this.trueStmt.exec(ctx);
    } else {
      this.falseStmt?.exec(ctx);
    }
  }
}
