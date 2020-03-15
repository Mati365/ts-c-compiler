/* eslint-disable no-use-before-define, @typescript-eslint/no-use-before-define */
import * as R from 'ramda';

import {empty} from '@compiler/grammar/matchers';

import {BinaryNode, ValueNode} from '@compiler/grammar/tree/TreeNode';
import {TreeVisitor} from '@compiler/grammar/tree/TreeVisitor';

import {TokenType, NumberToken} from '@compiler/lexer/tokens';
import {NodeLocation} from '@compiler/grammar/tree/NodeLocation';
import {
  PreprocessorGrammar,
  ASTPreprocessorNode,
  ASTPreprocessorKind,
} from '../constants';

/**
 * Transforms tree into for that second argument contains operator,
 * it is due to left recursion issue
 *
 * @class ASTOperatorNode
 * @extends {BinaryNode<ASTPreprocessorKind>}
 */
class ASTBinaryOpNode extends BinaryNode<ASTPreprocessorKind> {
  constructor(
    public op: TokenType,
    left: ASTPreprocessorNode,
    right: ASTPreprocessorNode,
  ) {
    super(
      ASTPreprocessorKind.BinaryOperator,
      left,
      right,
    );
  }

  toString(): string {
    const {op} = this;

    return `${super.toString()} op=${op}`;
  }

  /**
   * Creates ASTBinaryOpNode if provided both left and right
   * tree childs, if not creates left or right individually
   *
   * @static
   * @param {TokenType} op
   * @param {ASTPreprocessorNode} left
   * @param {ASTPreprocessorNode} right
   * @returns {(ASTBinaryOpNode | ASTPreprocessorNode)}
   * @memberof ASTBinaryOpNode
   */
  static createIfBothPresent(
    op: TokenType,
    left: ASTPreprocessorNode,
    right: ASTPreprocessorNode,
  ): ASTBinaryOpNode | ASTPreprocessorNode {
    if (left && right)
      return new ASTBinaryOpNode(op, left, right);

    if (!left)
      return right;

    return left;
  }
}

/**
 * @see
 * term -> number | ( expr )
 */
function term(g: PreprocessorGrammar): ASTPreprocessorNode {
  const token = g.consume();

  if (token.type === TokenType.NUMBER) {
    return new ValueNode<NumberToken, ASTPreprocessorKind>(
      ASTPreprocessorKind.Value,
      NodeLocation.fromTokenLoc(token.loc),
      token,
    );
  }

  if (token.type === TokenType.BRACKET && token.text === '(') {
    const expr = add(g);
    g.match(
      {
        type: TokenType.BRACKET,
        terminal: ')',
      },
    );

    return expr;
  }

  throw new SyntaxError;
}

/**
 * @see
 * mul = term mul'
 * mul = ε
 * mul' = "*" term mul'
 * mul' = "/" term mul'
 */
function mul(g: PreprocessorGrammar): ASTPreprocessorNode {
  return <ASTPreprocessorNode> g.or(
    {
      value() {
        return ASTBinaryOpNode.createIfBothPresent(
          null,
          term(g),
          mulPrim(g),
        );
      },
      empty,
    },
  );
}

function mulPrim(g: PreprocessorGrammar): ASTPreprocessorNode {
  return <ASTPreprocessorNode> g.or(
    {
      mul() {
        g.match(
          {
            type: TokenType.MUL,
          },
        );

        return new ASTBinaryOpNode(
          TokenType.MUL,
          term(g),
          mulPrim(g),
        );
      },

      div() {
        g.match(
          {
            type: TokenType.DIV,
          },
        );

        return new ASTBinaryOpNode(
          TokenType.DIV,
          term(g),
          mulPrim(g),
        );
      },

      empty,
    },
  );
}

/**
 * @see
 * add = mul add'
 * add' = ε
 * add' = "+" mul add'
 * add' = "-" mul add'
 */
function add(g: PreprocessorGrammar): ASTPreprocessorNode {
  return <ASTPreprocessorNode> g.or(
    {
      value() {
        return ASTBinaryOpNode.createIfBothPresent(
          null,
          mul(g),
          addPrim(g),
        );
      },
      empty() {
        return null;
      },
    },
  );
}

function addPrim(g: PreprocessorGrammar): ASTPreprocessorNode {
  return <ASTPreprocessorNode> g.or(
    {
      mul() {
        g.match(
          {
            type: TokenType.PLUS,
          },
        );

        return new ASTBinaryOpNode(
          TokenType.PLUS,
          mul(g),
          addPrim(g),
        );
      },

      div() {
        g.match(
          {
            type: TokenType.MINUS,
          },
        );

        return new ASTBinaryOpNode(
          TokenType.MINUS,
          mul(g),
          addPrim(g),
        );
      },

      empty,
    },
  );
}

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
class ReducePostfixOperatorsVisitor extends TreeVisitor<ASTPreprocessorNode> {
  protected self(): ReducePostfixOperatorsVisitor { return this; }

  enter(node: ASTPreprocessorNode): void {
    if (node.kind !== ASTPreprocessorKind.BinaryOperator)
      return;

    const binNode = <ASTBinaryOpNode> node;
    const rightBinNode = <ASTBinaryOpNode> binNode.right;

    if (!R.isNil(binNode.op) || rightBinNode?.kind !== ASTPreprocessorKind.BinaryOperator)
      return;

    binNode.op = rightBinNode.op;
    rightBinNode.op = null;

    if (rightBinNode.hasSingleSide())
      binNode.right = rightBinNode.getFirstNonNullSide();
  }
}

/**
 * Matches math expression into tree
 *
 * @see {@link https://en.wikipedia.org/wiki/Left_recursion}
 * @see {@link https://www.sigbus.info/compilerbook}
 * @see {@link https://www.geeksforgeeks.org/recursive-descent-parser/}
 * @see {@link https://www.lewuathe.com/how-to-construct-grammar-of-arithmetic-operations.html}
 *
 * Non recursive left:
 *
 * add = mul add'
 * add' = ε
 * add' = "+" mul add'
 * add' = "-" mul add'
 *
 * mul = term mul'
 * mul = ε
 * mul' = "*" term mul'
 * mul' = "/" term mul'
 *
 * term = <num>
 * term = "(" add ")"
 *
 * @export
 * @param {PreprocessorGrammar} g
 * @returns {ASTPreprocessorNode}
 */
export function mathExpression(g: PreprocessorGrammar): ASTPreprocessorNode {
  const node = add(g);

  (new ReducePostfixOperatorsVisitor).visit(node);

  return node;
}
