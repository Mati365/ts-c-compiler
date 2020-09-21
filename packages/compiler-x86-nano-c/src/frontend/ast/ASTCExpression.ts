import {NodeLocation} from '@compiler/grammar/tree/NodeLocation';
import {ASTCCompilerKind, ASTCCompilerNode} from './ASTCCompilerNode';

export class ASTCExpression extends ASTCCompilerNode {
  constructor(
    loc: NodeLocation,
    public readonly expression: ASTCCompilerNode,
  ) {
    super(ASTCCompilerKind.Expression, loc);
  }
}
