import {walkOverFields} from '@compiler/grammar/decorators/walkOverFields';

import {NodeLocation} from '@compiler/grammar/tree/NodeLocation';
import {ASTCCompilerKind, ASTCCompilerNode} from './ASTCCompilerNode';
import {ASTCAssignmentExpression} from './ASTCAssignmentExpression';
import {ASTCDesignatorList} from './ASTCDesignatorList';

@walkOverFields(
  {
    fields: [
      'assignmentExpression',
      'initializers',
      'designation',
    ],
  },
)
export class ASTCInitializer extends ASTCCompilerNode {
  constructor(
    loc: NodeLocation,
    public readonly assignmentExpression: ASTCAssignmentExpression,
    public readonly initializers?: ASTCInitializer[],
    public readonly designation?: ASTCDesignatorList,
  ) {
    super(ASTCCompilerKind.Initializer, loc);
  }
}
