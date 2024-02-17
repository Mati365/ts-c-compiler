import { NodeLocation } from '@ts-cc/grammar';

import type { CInterpreterContext } from '../interpreter';
import type { ASTCStmtNode } from './ASTCStmtNode';
import type { ASTCExpressionNode } from './ASTCExpressionNode';

import {
  ASTCPreprocessorKind,
  ASTCPreprocessorTreeNode,
} from './ASTCPreprocessorTreeNode';

export class ASTCIfNode extends ASTCPreprocessorTreeNode {
  constructor(
    loc: NodeLocation,
    readonly test: ASTCExpressionNode,
    readonly trueStmt: ASTCStmtNode,
    readonly falseStmt?: ASTCStmtNode | null,
  ) {
    super(ASTCPreprocessorKind.If, loc);
  }

  override exec(ctx: CInterpreterContext): void {
    if (ctx.evalExpression(this.test)) {
      this.trueStmt.exec(ctx);
    } else {
      this.falseStmt?.exec(ctx);
    }
  }
}
