import { NodeLocation } from '@compiler/grammar/tree/NodeLocation';
import { ASTCCompilerKind, ASTCCompilerNode } from './ASTCCompilerNode';

export class ASTCContinueStatement extends ASTCCompilerNode {
  constructor(loc: NodeLocation) {
    super(ASTCCompilerKind.ContinueStmt, loc);
  }
}
