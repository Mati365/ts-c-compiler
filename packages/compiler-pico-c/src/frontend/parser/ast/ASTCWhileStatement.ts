import {walkOverFields} from '@compiler/grammar/decorators/walkOverFields';

import {NodeLocation} from '@compiler/grammar/tree/NodeLocation';
import {ASTCCompilerKind, ASTCCompilerNode} from './ASTCCompilerNode';

/**
 * while (true) {}
 *
 * @export
 * @class ASTCWhileStatement
 * @extends {ASTCCompilerNode}
 */
@walkOverFields(
  {
    fields: [
      'expression',
      'statement',
    ],
  },
)
export class ASTCWhileStatement extends ASTCCompilerNode {
  constructor(
    loc: NodeLocation,
    readonly expression: ASTCCompilerNode,
    readonly statement: ASTCCompilerNode,
    kind: ASTCCompilerKind = ASTCCompilerKind.WhileStmt,
  ) {
    super(kind, loc);
  }
}

/**
 * do { } while(true);
 *
 * @export
 * @class ASTCDoWhileStatement
 * @extends {ASTCWhileStatement}
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
