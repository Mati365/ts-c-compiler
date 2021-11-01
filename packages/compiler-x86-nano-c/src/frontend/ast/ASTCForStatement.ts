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
    ],
  },
)
export class ASTCForStatement extends ASTCCompilerNode {
  constructor(
    loc: NodeLocation,
    public readonly statement: ASTCCompilerNode,
    public readonly declaration: ASTCCompilerNode,
    public readonly condition?: ASTCCompilerNode,
    public readonly expression?: ASTCCompilerNode,
  ) {
    super(ASTCCompilerKind.ForStmt, loc);
  }
}
