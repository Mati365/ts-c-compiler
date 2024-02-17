import { NodeLocation } from '@ts-cc/grammar';
import { TreeVisitor } from '@ts-cc/grammar';

import {
  ASTCPreprocessorKind,
  ASTCPreprocessorTreeNode,
} from './ASTCPreprocessorTreeNode';

import { CInterpreterContext } from '../interpreter';

/**
 * @example
 *  expr1 && expr2 && expr3 > expr2
 */
export class ASTCExpressionNode extends ASTCPreprocessorTreeNode {
  constructor(
    loc: NodeLocation,
    public expression: ASTCPreprocessorTreeNode,
  ) {
    super(ASTCPreprocessorKind.Expression, loc);
  }

  walk(visitor: TreeVisitor<ASTCPreprocessorTreeNode>): void {
    const { expression } = this;

    if (expression) {
      visitor.visit(expression);
    }
  }

  override exec(ctx: CInterpreterContext) {
    return ctx.evalExpression(this.expression);
  }
}
