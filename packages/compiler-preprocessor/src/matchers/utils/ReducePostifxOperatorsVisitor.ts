import * as R from 'ramda';

import {TreeVisitor} from '@compiler/grammar/tree/TreeVisitor';
import {ASTPreprocessorBinaryOpNode} from '../../nodes/ASTPreprocessorBinaryOpNode';
import {
  ASTPreprocessorNode,
  ASTPreprocessorKind,
} from '../../constants';

/**
 * @see
 * transforms form where operator is in right node:
 *
 * <BinaryOperator op=null />
 *     <Value value=3 />
 *     <BinaryOperator op=PLUS />
 *        <BinaryOperator op=null />
 *           <Value value=2 />
 *           <BinaryOperator op=MUL />
 *              <Value value=5 />
 *
 * into proper AST:
 *
 * <BinaryOperator op=PLUS />
 *     <Value value=3 />
 *     <BinaryOperator op=MUL />
 *        <Value value=2 />
 *        <Value value=5 />
 *
 * @class ReducePostfixOperatorsVisitor
 * @extends {TreeVisitor<ASTPreprocessorNode>}
 */
export class ReducePostfixOperatorsVisitor extends TreeVisitor<ASTPreprocessorNode> {
  constructor(
    private readonly binOpNodeKind: ASTPreprocessorKind = ASTPreprocessorKind.BinaryOperator,
  ) {
    super();
  }

  enter(node: ASTPreprocessorNode): void {
    const {binOpNodeKind} = this;
    if (node.kind !== binOpNodeKind)
      return;

    const binNode = <ASTPreprocessorBinaryOpNode> node;
    const rightBinNode = <ASTPreprocessorBinaryOpNode> binNode.right;

    if (!R.isNil(binNode.op) || rightBinNode?.kind !== binOpNodeKind)
      return;

    binNode.op = rightBinNode.op;
    rightBinNode.op = null;

    if (rightBinNode.hasSingleSide())
      binNode.right = rightBinNode.getFirstNonNullSide();
  }
}
