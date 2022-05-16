import {walkOverFields} from '@compiler/grammar/decorators/walkOverFields';

import {NodeLocation} from '@compiler/grammar/tree/NodeLocation';
import {ASTCCompilerKind, ASTCCompilerNode} from './ASTCCompilerNode';

@walkOverFields(
  {
    fields: [
      'expression',
    ],
  },
)
export class ASTCExpressionStatement extends ASTCCompilerNode {
  constructor(
    loc: NodeLocation,
    readonly expression?: ASTCCompilerNode,
  ) {
    super(ASTCCompilerKind.ExpressionStmt, loc);
  }
}
