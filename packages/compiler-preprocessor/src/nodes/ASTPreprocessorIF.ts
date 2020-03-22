import {NodeLocation} from '@compiler/grammar/tree/NodeLocation';
import {TreeVisitor} from '@compiler/grammar/tree/TreeVisitor';

import {
  ASTPreprocessorKind,
  ASTPreprocessorNode,
} from '../constants';

import {ASTPreprocessorExpression} from './ASTPreprocessorExpression';

/**
 * @example
 * %if 2 > 4
 *   mov ax, bx
 * %elif
 *   xor bx, bx
 * %endif
 *
 * @export
 * @class ASTPreprocessorIF
 * @extends {ASTPreprocessorNode}
 */
export class ASTPreprocessorIF extends ASTPreprocessorNode {
  constructor(
    loc: NodeLocation,
    public readonly test: ASTPreprocessorExpression,
    public readonly consequent: ASTPreprocessorNode,
    public readonly alternate: ASTPreprocessorNode = null,
  ) {
    super(ASTPreprocessorKind.IfStmt, loc);
  }

  /**
   * Iterates throught tree
   *
   * @param {TreeVisitor<ASTPreprocessorNode>} visitor
   * @memberof BinaryNode
   */
  walk(visitor: TreeVisitor<ASTPreprocessorNode>): void {
    const {test, consequent, alternate} = this;

    super.walk(visitor);

    if (test)
      visitor.visit(test);

    if (consequent)
      visitor.visit(consequent);

    if (alternate)
      visitor.visit(alternate);
  }
}
