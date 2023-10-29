import { walkOverFields } from '@ts-c-compiler/grammar';

import { NodeLocation } from '@ts-c-compiler/grammar';
import { ASTCCompilerKind, ASTCCompilerNode } from './ASTCCompilerNode';

/**
 * while (true) {}
 */
@walkOverFields({
  fields: ['expression', 'statement'],
})
export class ASTCWhileStatement extends ASTCCompilerNode {
  constructor(
    loc: NodeLocation,
    public expression: ASTCCompilerNode,
    public statement: ASTCCompilerNode,
    kind: ASTCCompilerKind = ASTCCompilerKind.WhileStmt,
  ) {
    super(kind, loc);
  }
}

/**
 * do { } while(true);
 */
export class ASTCDoWhileStatement extends ASTCWhileStatement {
  constructor(
    loc: NodeLocation,
    expression: ASTCCompilerNode,
    statement: ASTCCompilerNode,
  ) {
    super(loc, expression, statement, ASTCCompilerKind.DoWhileStmt);
  }
}
