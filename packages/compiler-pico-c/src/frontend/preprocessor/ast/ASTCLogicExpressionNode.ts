import { NodeLocation } from '@ts-c-compiler/grammar';
import { TreeVisitor } from '@ts-c-compiler/grammar';

import {
  ASTCPreprocessorKind,
  ASTCPreprocessorTreeNode,
} from './ASTCPreprocessorTreeNode';

import { CInterpreterContext } from '../interpreter';

/**
 * @example
 *  expr1 && expr2 && expr3 > expr2
 */
export class ASTCLogicExpressionNode extends ASTCPreprocessorTreeNode {
  constructor(loc: NodeLocation, public expression: ASTCPreprocessorTreeNode) {
    super(ASTCPreprocessorKind.LogicExpression, loc);
  }

  walk(visitor: TreeVisitor<ASTCPreprocessorTreeNode>): void {
    const { expression } = this;

    if (expression) {
      visitor.visit(expression);
    }
  }

  override exec(ctx: CInterpreterContext): void {
    console.info(ctx);
  }
}
