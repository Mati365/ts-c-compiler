import { NodeLocation } from '@ts-cc/grammar';
import { ASTCCompilerNode, ASTCCompilerKind } from './ASTCCompilerNode';
import { ASTCExpression } from './ASTCExpression';

export class ASTCArgumentsExpressionList extends ASTCExpression {
  constructor(loc: NodeLocation, assignments: ASTCCompilerNode[]) {
    super(loc, assignments, ASTCCompilerKind.ArgumentsExpressionList);
  }
}
