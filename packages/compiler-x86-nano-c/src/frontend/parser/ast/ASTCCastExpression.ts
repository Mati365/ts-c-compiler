import {walkOverFields} from '@compiler/grammar/decorators/walkOverFields';

import {NodeLocation} from '@compiler/grammar/tree/NodeLocation';
import {ASTCTypeName} from './ASTCTypeName';
import {
  ASTCTreeNode,
  ASTCCompilerKind,
  ASTCCompilerNode,
} from './ASTCCompilerNode';

@walkOverFields(
  {
    fields: [
      'typeName',
      'expression',
    ],
  },
)
export class ASTCCastExpression extends ASTCCompilerNode {
  constructor(
    loc: NodeLocation,
    readonly typeName?: ASTCTypeName,
    readonly expression?: ASTCTreeNode,
  ) {
    super(ASTCCompilerKind.CastExpression, loc);
  }
}
