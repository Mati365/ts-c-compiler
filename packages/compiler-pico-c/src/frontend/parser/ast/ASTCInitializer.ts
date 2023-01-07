import { walkOverFields } from '@compiler/grammar/decorators/walkOverFields';

import { NodeLocation } from '@compiler/grammar/tree/NodeLocation';
import { ASTCCompilerKind, ASTCCompilerNode } from './ASTCCompilerNode';
import { ASTCAssignmentExpression } from './ASTCAssignmentExpression';
import { ASTCDesignatorList } from './ASTCDesignatorList';

@walkOverFields({
  fields: ['assignmentExpression', 'initializers', 'designation'],
})
export class ASTCInitializer extends ASTCCompilerNode {
  constructor(
    loc: NodeLocation,
    readonly assignmentExpression: ASTCAssignmentExpression,
    readonly initializers?: ASTCInitializer[],
    readonly designation?: ASTCDesignatorList,
  ) {
    super(ASTCCompilerKind.Initializer, loc);
  }

  hasDesignation() {
    return !!this.designation;
  }
  hasAssignment() {
    return !!this.assignmentExpression;
  }
  hasInitializerList() {
    return !!this.initializers;
  }
}
