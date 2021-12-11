import {walkOverFields} from '@compiler/grammar/decorators/walkOverFields';

import {NodeLocation} from '@compiler/grammar/tree/NodeLocation';
import {ASTCCompilerKind, ASTCCompilerNode} from './ASTCCompilerNode';

/**
 * Expressions that can be evaluated during compile time
 *
 * @export
 * @class ASTCConstantExpression
 * @extends {ASTCExpression}
 */
@walkOverFields(
  {
    fields: [
      'expression',
    ],
  },
)
export class ASTCConstantExpression extends ASTCCompilerNode {
  constructor(
    loc: NodeLocation,
    public readonly expression: ASTCCompilerNode,
  ) {
    super(ASTCCompilerKind.ConstantExpression, loc);
  }
}
