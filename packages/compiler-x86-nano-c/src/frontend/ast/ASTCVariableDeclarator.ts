import {NodeLocation} from '@compiler/grammar/tree/NodeLocation';
import {TreeVisitor} from '@compiler/grammar/tree/TreeVisitor';
import {ASTCCompilerNode, ASTCCompilerKind} from './ASTCCompilerNode';
import {ASTCType} from './ASTCType';

/**
 * List of declarations variables with the same type
 *
 * @export
 * @class ASTCVariableDeclarator
 * @extends {ASTCCompilerNode}
 */
export class ASTCVariableDeclarator extends ASTCCompilerNode {
  constructor(
    loc: NodeLocation,
    declarations: ASTCCompilerNode[],
  ) {
    super(ASTCCompilerKind.VariableDeclarator, loc, declarations);
  }
}

/**
 * Single variable declaration
 *
 * @export
 * @class ASTCVariableDeclaration
 * @extends {ASTCCompilerNode}
 */
export class ASTCVariableDeclaration extends ASTCCompilerNode {
  constructor(
    loc: NodeLocation,
    public readonly type: ASTCType,
    public readonly name: string,
    public readonly expression: ASTCCompilerNode = null,
  ) {
    super(ASTCCompilerKind.VariableDeclaration, loc);
  }

  toString() {
    const {type, kind, name} = this;

    return `${kind} type="${type}" name="${name}"`;
  }

  /**
   * Iterates throught tree
   *
   * @param {TreeVisitor<ASTCCompilerNode>} visitor
   * @memberof ASTCVariableDeclaration
   */
  walk(visitor: TreeVisitor<ASTCCompilerNode>): void {
    const {expression} = this;

    super.walk(visitor);

    if (expression)
      visitor.visit(expression);
  }
}
