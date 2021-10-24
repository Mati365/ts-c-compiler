import {walkOverFields} from '@compiler/grammar/decorators/walkOverFields';

import {NodeLocation} from '@compiler/grammar/tree/NodeLocation';
import {ASTCTypeName} from './ASTCTypeName';
import {ASTCCompilerKind, ASTCCompilerNode} from './ASTCCompilerNode';
import {ASTCUnaryExpression} from './ASTCUnaryExpression';

@walkOverFields(
  {
    fields: [
      'typeName',
      'unaryExpression',
      'castExpression',
    ],
  },
)
export class ASTCCastExpression extends ASTCCompilerNode {
  constructor(
    loc: NodeLocation,
    public readonly unaryExpression?: ASTCUnaryExpression,
    public readonly typeName?: ASTCTypeName,
    public readonly castExpression?: ASTCCastExpression,
  ) {
    super(ASTCCompilerKind.CastExpression, loc);
  }
}
