import { NodeLocation } from '@ts-cc/grammar';
import { ASTCCompilerKind, ASTCCompilerNode } from './ASTCCompilerNode';

export class ASTCStmt extends ASTCCompilerNode {
  constructor(loc: NodeLocation, children: ASTCCompilerNode[]) {
    super(ASTCCompilerKind.Stmt, loc, children);
  }
}
