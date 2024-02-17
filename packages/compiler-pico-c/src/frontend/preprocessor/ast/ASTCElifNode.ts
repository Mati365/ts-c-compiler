import { NodeLocation } from '@ts-cc/grammar';

import type { CInterpreterContext } from '../interpreter';
import type { ASTCStmtNode } from './ASTCStmtNode';
import type { ASTCExpressionNode } from './ASTCExpressionNode';

import {
  ASTCPreprocessorKind,
  ASTCPreprocessorTreeNode,
} from './ASTCPreprocessorTreeNode';

export class ASTCElifNode extends ASTCPreprocessorTreeNode {
  constructor(
    loc: NodeLocation,
    readonly test: ASTCExpressionNode,
    readonly trueStmt: ASTCStmtNode,
    readonly falseStmt?: ASTCStmtNode | null,
  ) {
    super(ASTCPreprocessorKind.ElIf, loc);
  }

  override exec(ctx: CInterpreterContext): void {
    if (ctx.evalExpression(this.test)) {
      this.trueStmt.exec(ctx);
    } else {
      this.falseStmt?.exec(ctx);
    }
  }
}
