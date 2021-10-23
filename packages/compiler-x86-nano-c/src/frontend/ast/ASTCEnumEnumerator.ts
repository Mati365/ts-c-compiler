import {NodeLocation} from '@compiler/grammar/tree/NodeLocation';
import {TreeVisitor} from '@compiler/grammar/tree/TreeVisitor';
import {Token} from '@compiler/lexer/tokens';
import {ASTCConstantExpression} from './ASTCConstantExpression';
import {ASTCCompilerKind, ASTCCompilerNode} from './ASTCCompilerNode';

/**
 * Node that holds single enum item such as RED = 'blue'
 *
 * @export
 * @class ASTCEnumEnumeration
 * @extends {ASTCCompilerNode}
 */
export class ASTCEnumEnumeration extends ASTCCompilerNode {
  constructor(
    loc: NodeLocation,
    public readonly name: Token<string>,
    public readonly expression?: ASTCConstantExpression,
  ) {
    super(ASTCCompilerKind.EnumItem, loc);
  }

  /**
   * @returns
   * @memberof ASTCEnumEnumeration
   */
  toString() {
    const {kind, name} = this;

    return `${kind} name="${name.toString()}"`.trim();
  }

  /**
   * Iterates throught tree
   *
   * @param {TreeVisitor<ASTCCompilerNode>} visitor
   * @memberof ASTCEnumSpecifier
   */
  walk(visitor: TreeVisitor<ASTCCompilerNode>): void {
    const {expression} = this;

    super.walk(visitor);

    if (expression)
      visitor.visit(expression);
  }
}
