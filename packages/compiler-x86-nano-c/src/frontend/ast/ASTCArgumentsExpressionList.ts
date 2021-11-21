import {NodeLocation} from '@compiler/grammar/tree/NodeLocation';
import {ASTCCompilerNode, ASTCCompilerKind} from './ASTCCompilerNode';
import {ASTCExpression} from './ASTCExpression';

export class ASTCArgumentsExpressionList extends ASTCExpression {
  constructor(loc: NodeLocation, assignments: ASTCCompilerNode[]) {
    super(loc, assignments, ASTCCompilerKind.ArgumentsExpressionList);
  }
}
