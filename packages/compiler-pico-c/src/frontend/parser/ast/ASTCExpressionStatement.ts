import { walkOverFields } from '@ts-cc/grammar';

import { NodeLocation } from '@ts-cc/grammar';
import { ASTCCompilerKind, ASTCCompilerNode } from './ASTCCompilerNode';

export function isASTCExpressionStmtNode(
  node: ASTCCompilerNode,
): node is ASTCExpressionStatement {
  return node.kind === ASTCCompilerKind.ExpressionStmt;
}

@walkOverFields({
  fields: ['expression'],
})
export class ASTCExpressionStatement extends ASTCCompilerNode {
  constructor(
    loc: NodeLocation,
    readonly expression?: ASTCCompilerNode,
  ) {
    super(ASTCCompilerKind.ExpressionStmt, loc);
  }
}
