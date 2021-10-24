import {walkOverFields} from '@compiler/grammar/decorators/walkOverFields';
import {NodeLocation} from '@compiler/grammar/tree/NodeLocation';
import {ASTCCompilerKind, ASTCCompilerNode} from './ASTCCompilerNode';
import {ASTCAssignmentExpression} from './ASTCAssignmentExpression';

@walkOverFields(
  {
    fields: ['parameters'],
  },
)
export class ASTCArgumentsExpressionList extends ASTCCompilerNode {
  constructor(
    loc: NodeLocation,
    public readonly parameters: ASTCAssignmentExpression[],
  ) {
    super(ASTCCompilerKind.ArgumentsExpressionList, loc);
  }
}
