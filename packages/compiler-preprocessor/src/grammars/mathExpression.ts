/* eslint-disable no-use-before-define, @typescript-eslint/no-use-before-define */
import {TreeNode, BinaryNode, ValueNode} from '@compiler/grammar/tree/TreeNode';
import {Grammar} from '@compiler/grammar/Grammar';
import {TokenType, NumberToken} from '@compiler/lexer/tokens';
import {NodeLocation} from '@compiler/grammar/tree/NodeLocation';

class PrefixOperatorNode extends TreeNode {
  constructor(
    public readonly op: TokenType,
    public readonly left: TreeNode,
    public readonly right: TreeNode,
  ) {
    super(left?.loc);
  }
}

/**
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
 */

/**
 * @see
 * term -> number | ( expr )
 *
 * @template I
 * @param {Grammar<I>} g
 * @returns {TreeNode}
 */
function term<I>(g: Grammar<I>): TreeNode {
  const token = g.consume();

  if (token.type === TokenType.NUMBER)
    return new ValueNode<NumberToken>(token, NodeLocation.fromTokenLoc(token.loc));

  if (token.type === TokenType.BRACKET && token.text === '(') {
    const expr = add<I>(g);
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
 * MUL
 *
 * @template I
 * @param {Grammar<I>} g
 * @returns {TreeNode}
 */
function mul<I>(g: Grammar<I>): TreeNode {
  return <TreeNode> g.or(
    {
      value() {
        return BinaryNode.createOptionalBinary(
          term<I>(g),
          mulPrim<I>(g),
        );
      },
      empty() {
        return null;
      },
    },
  );
}

/**
 * MUL prefix
 *
 * @template I
 * @param {Grammar<I>} g
 * @returns {TreeNode}
 */
function mulPrim<I>(g: Grammar<I>): TreeNode {
  return <TreeNode> g.or(
    {
      mul() {
        g.match(
          {
            type: TokenType.MUL,
          },
        );

        return new PrefixOperatorNode(
          TokenType.MUL,
          term<I>(g),
          mulPrim<I>(g),
        );
      },

      div() {
        g.match(
          {
            type: TokenType.DIV,
          },
        );

        return new PrefixOperatorNode(
          TokenType.DIV,
          term<I>(g),
          mulPrim<I>(g),
        );
      },

      empty() {
        return null;
      },
    },
  );
}

/**
 * ADD
 *
 * @template I
 * @param {Grammar<I>} g
 * @returns {TreeNode}
 */
function add<I>(g: Grammar<I>): TreeNode {
  return <TreeNode> g.or(
    {
      value() {
        return BinaryNode.createOptionalBinary(
          mul<I>(g),
          addPrim<I>(g),
        );
      },
      empty() {
        return null;
      },
    },
  );
}

/**
 * ADD prefix
 *
 * @template I
 * @param {Grammar<I>} g
 * @returns {TreeNode}
 */
function addPrim<I>(g: Grammar<I>): TreeNode {
  return <TreeNode> g.or(
    {
      mul() {
        g.match(
          {
            type: TokenType.PLUS,
          },
        );

        return new PrefixOperatorNode(
          TokenType.PLUS,
          mul<I>(g),
          addPrim<I>(g),
        );
      },

      div() {
        g.match(
          {
            type: TokenType.MINUS,
          },
        );

        return new PrefixOperatorNode(
          TokenType.MINUS,
          mul<I>(g),
          addPrim<I>(g),
        );
      },

      empty() {
        return null;
      },
    },
  );
}

/**
 * Matches math expression into tree
 *
 * @see {@link https://en.wikipedia.org/wiki/Left_recursion}
 * @see {@link https://www.sigbus.info/compilerbook}
 * @see {@link https://www.geeksforgeeks.org/recursive-descent-parser/}
 *
 * @export
 * @template I
 * @param {Grammar<I>} g
 * @returns {TreeNode}
 */
export function mathExpression<I>(g: Grammar<I>): TreeNode {
  return add<I>(g);
}
