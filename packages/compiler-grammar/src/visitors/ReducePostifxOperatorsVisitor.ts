import * as R from 'ramda';

import { TreeVisitor } from '../tree/TreeVisitor';
import { BinaryOpNode, TreeNode } from '../tree/TreeNode';

export class ReducePostfixOperatorsVisitor extends TreeVisitor {
  constructor(private readonly binOpNodeKind: any) {
    super();
  }

  enter(node: TreeNode): void {
    const { binOpNodeKind } = this;
    if (node.kind !== binOpNodeKind) {
      return;
    }

    const binNode = <BinaryOpNode>node;
    const rightBinNode = <BinaryOpNode>binNode.right;

    if (!R.isNil(binNode.op) || rightBinNode?.kind !== binOpNodeKind) {
      return;
    }

    // move operand to parent
    binNode.op = rightBinNode.op;
    rightBinNode.op = null;

    if (rightBinNode.hasSingleSide()) {
      binNode.right = rightBinNode.getFirstNonNullSide();
    }
  }
}
