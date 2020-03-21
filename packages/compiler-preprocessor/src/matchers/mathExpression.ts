/* eslint-disable no-use-before-define, @typescript-eslint/no-use-before-define */
import * as R from 'ramda';

import {empty} from '@compiler/grammar/matchers';

import {ValueNode} from '@compiler/grammar/tree/TreeNode';
import {TreeVisitor} from '@compiler/grammar/tree/TreeVisitor';

import {TokenType, NumberToken} from '@compiler/lexer/tokens';
import {NodeLocation} from '@compiler/grammar/tree/NodeLocation';

import {ASTBinaryOpNode, createBinOpIfBothSidesPresent} from '../nodes/ASTBinaryOpNode';
import {
  PreprocessorGrammar,
  ASTPreprocessorNode,
  ASTPreprocessorKind,
} from '../constants';

/**
 * @see
 * term -> number | ( expr )
 */
function term(g: PreprocessorGrammar): ASTPreprocessorNode {
  const {currentToken: token} = g;

  if (token.type === TokenType.NUMBER) {
    g.consume();
    return new ValueNode<NumberToken, ASTPreprocessorKind>(
      ASTPreprocessorKind.Value,
      NodeLocation.fromTokenLoc(token.loc),
      token,
    );
  }

  if (token.type === TokenType.BRACKET && token.text === '(') {
    g.consume();
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
        return createBinOpIfBothSidesPresent(
          ASTBinaryOpNode,
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
        return createBinOpIfBothSidesPresent(
          ASTBinaryOpNode,
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
      add() {
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

      minus() {
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
export class ReducePostfixOperatorsVisitor extends TreeVisitor<ASTPreprocessorNode> {
  protected self(): ReducePostfixOperatorsVisitor { return this; }

  constructor(
    private readonly binOpNodeKind: ASTPreprocessorKind = ASTPreprocessorKind.BinaryOperator,
  ) {
    super();
  }

  enter(node: ASTPreprocessorNode): void {
    const {binOpNodeKind} = this;
    if (node.kind !== binOpNodeKind)
      return;

    const binNode = <ASTBinaryOpNode> node;
    const rightBinNode = <ASTBinaryOpNode> binNode.right;

    if (!R.isNil(binNode.op) || rightBinNode?.kind !== binOpNodeKind)
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
