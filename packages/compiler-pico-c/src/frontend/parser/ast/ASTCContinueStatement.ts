import { NodeLocation } from '@ts-cc/grammar';
import { ASTCCompilerKind, ASTCCompilerNode } from './ASTCCompilerNode';

export class ASTCContinueStatement extends ASTCCompilerNode {
  constructor(loc: NodeLocation) {
    super(ASTCCompilerKind.ContinueStmt, loc);
  }
}
