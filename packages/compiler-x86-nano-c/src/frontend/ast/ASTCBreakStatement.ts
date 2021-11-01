import {NodeLocation} from '@compiler/grammar/tree/NodeLocation';
import {ASTCCompilerKind, ASTCCompilerNode} from './ASTCCompilerNode';

export class ASTCBreakStatement extends ASTCCompilerNode {
  constructor(loc: NodeLocation) {
    super(ASTCCompilerKind.BreakStmt, loc);
  }
}
