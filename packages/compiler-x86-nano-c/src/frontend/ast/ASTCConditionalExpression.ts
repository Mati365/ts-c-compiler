import {walkOverFields} from '@compiler/grammar/decorators/walkOverFields';

import {NodeLocation} from '@compiler/grammar/tree/NodeLocation';
import {ASTCCompilerKind, ASTCCompilerNode} from './ASTCCompilerNode';
import {ASTCOperatorBinaryExpression} from './ASTCOperatorBinaryExpression';
import {ASTCExpression} from './ASTCExpression';

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
    public readonly logicalOrExpression: ASTCOperatorBinaryExpression,
    public readonly trueExpression?: ASTCExpression,
    public readonly falseExpression?: ASTCConditionalExpression,
  ) {
    super(ASTCCompilerKind.ConditionalExpression, loc);
  }
}
