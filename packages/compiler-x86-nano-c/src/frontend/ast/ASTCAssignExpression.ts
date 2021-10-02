import {NodeLocation} from '@compiler/grammar/tree/NodeLocation';
import {TreeVisitor} from '@compiler/grammar/tree/TreeVisitor';
import {TokenType} from '@compiler/lexer/tokens';
import {ASTCCompilerKind, ASTCCompilerNode} from './ASTCCompilerNode';

export class ASTCAssignExpression extends ASTCCompilerNode {
  constructor(
    loc: NodeLocation,
    public readonly unary: ASTCCompilerNode,
    public readonly operator: TokenType,
    public readonly expression: ASTCCompilerNode,
  ) {
    super(ASTCCompilerKind.AssignExpression, loc);
  }

  toString() {
    const {kind, operator} = this;

    return `${kind} operator="${operator}"`;
  }

  /**
   * Iterates throught tree
   *
   * @param {TreeVisitor<ASTCCompilerNode>} visitor
   * @memberof BinaryNode
   */
  walk(visitor: TreeVisitor<ASTCCompilerNode>): void {
    const {unary, expression} = this;

    super.walk(visitor);

    if (unary)
      visitor.visit(unary);

    if (expression)
      visitor.visit(expression);
  }
}
