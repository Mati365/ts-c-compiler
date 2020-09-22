import * as R from 'ramda';

import {TreeVisitor} from '@compiler/grammar/tree/TreeVisitor';
import {ASTCBinaryOpNode, ASTCCompilerKind, ASTCCompilerNode} from '../../ast';

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
 * @extends {TreeVisitor<ASTCBinaryOpNode>}
 */
export class ReducePostfixOperatorsVisitor extends TreeVisitor<ASTCCompilerNode> {
  constructor(
    private readonly binOpNodeKind: ASTCCompilerKind = ASTCCompilerKind.BinaryOperator,
  ) {
    super();
  }

  enter(node: ASTCCompilerNode): void {
    const {binOpNodeKind} = this;
    if (node.kind !== binOpNodeKind)
      return;

    const binNode = <ASTCBinaryOpNode> node;
    const rightBinNode = <ASTCBinaryOpNode> binNode.right;

    if (!R.isNil(binNode.op) || rightBinNode?.kind !== binOpNodeKind)
      return;

    // move operand to parent
    binNode.op = rightBinNode.op;
    rightBinNode.op = null;

    if (rightBinNode.hasSingleSide())
      binNode.right = rightBinNode.getFirstNonNullSide();
  }
}
