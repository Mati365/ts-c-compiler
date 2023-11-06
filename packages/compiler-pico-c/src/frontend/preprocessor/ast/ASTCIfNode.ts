import { NodeLocation } from '@ts-c-compiler/grammar';

import type { CInterpreterContext } from '../interpreter';
import type { ASTCStmtNode } from './ASTCStmtNode';
import {
  ASTCPreprocessorKind,
  ASTCPreprocessorTreeNode,
} from './ASTCPreprocessorTreeNode';

export class ASTCIfNode extends ASTCPreprocessorTreeNode {
  constructor(
    loc: NodeLocation,
    readonly test: ASTCPreprocessorTreeNode,
    readonly trueStmt: ASTCStmtNode,
    readonly falseStmt?: ASTCStmtNode | null,
  ) {
    super(ASTCPreprocessorKind.If, loc);
  }

  override exec(ctx: CInterpreterContext): void {
    console.info(ctx);
  }
}
