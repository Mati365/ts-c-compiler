import {walkOverFields} from '@compiler/grammar/decorators/walkOverFields';

import {NodeLocation} from '@compiler/grammar/tree/NodeLocation';
import {ASTCCompilerKind, ASTCCompilerNode} from './ASTCCompilerNode';
import {ASTCAssignmentExpression} from './ASTCAssignmentExpression';

@walkOverFields(
  {
    fields: [
      'assignmentExpression',
      'initializers',
    ],
  },
)
export class ASTCInitializer extends ASTCCompilerNode {
  constructor(
    loc: NodeLocation,
    public readonly assignmentExpression: ASTCAssignmentExpression,
    public readonly initializers?: ASTCInitializer[],
  ) {
    super(ASTCCompilerKind.Initializer, loc);
  }
}
