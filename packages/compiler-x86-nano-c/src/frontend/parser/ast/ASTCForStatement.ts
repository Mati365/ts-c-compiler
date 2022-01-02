import {walkOverFields} from '@compiler/grammar/decorators/walkOverFields';

import {NodeLocation} from '@compiler/grammar/tree/NodeLocation';
import {ASTCCompilerKind, ASTCCompilerNode} from './ASTCCompilerNode';

/**
 * for (...) {}
 *
 * @export
 * @class ASTCWhileStatement
 * @extends {ASTCCompilerNode}
 */
@walkOverFields(
  {
    fields: [
      'declaration',
      'condition',
      'expression',
      'statement',
    ],
  },
)
export class ASTCForStatement extends ASTCCompilerNode {
  constructor(
    loc: NodeLocation,
    readonly statement: ASTCCompilerNode,
    readonly declaration: ASTCCompilerNode,
    readonly condition?: ASTCCompilerNode,
    readonly expression?: ASTCCompilerNode,
  ) {
    super(ASTCCompilerKind.ForStmt, loc);
  }
}
