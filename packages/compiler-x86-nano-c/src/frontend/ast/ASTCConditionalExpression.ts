import {walkOverFields} from '@compiler/grammar/decorators/walkOverFields';

import {NodeLocation} from '@compiler/grammar/tree/NodeLocation';
import {ASTCCompilerKind, ASTCCompilerNode} from './ASTCCompilerNode';

@walkOverFields(
  {
    fields: [
      'logicalOrExpression',
      'trueExpression',
      'falseExpression',
    ],
  },
)
export class ASTCConditionalExpression extends ASTCCompilerNode {
  constructor(
    loc: NodeLocation,
    public readonly logicalOrExpression: ASTCCompilerNode,
    public readonly trueExpression?: ASTCCompilerNode,
    public readonly falseExpression?: ASTCCompilerNode,
  ) {
    super(ASTCCompilerKind.ConditionalExpression, loc);
  }
}
