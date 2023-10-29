import { NodeLocation } from '@ts-c/grammar';
import { ASTCCompilerKind, ASTCCompilerNode } from './ASTCCompilerNode';

export class ASTCBreakStatement extends ASTCCompilerNode {
  constructor(loc: NodeLocation) {
    super(ASTCCompilerKind.BreakStmt, loc);
  }
}
