/* eslint-disable no-use-before-define, @typescript-eslint/no-use-before-define */
import {empty} from '@compiler/grammar/matchers';

import {BinaryNode, ValueNode} from '@compiler/grammar/tree/TreeNode';
import {TokenType, NumberToken} from '@compiler/lexer/tokens';
import {NodeLocation} from '@compiler/grammar/tree/NodeLocation';
import {
  PreprocessorGrammar,
  ASTPreprocessorNode,
  ASTPreprocessorKind,
} from '../constants';

class ASTPrefixOperatorNode extends BinaryNode<ASTPreprocessorKind> {
  constructor(
    public readonly op: TokenType,
    left: ASTPreprocessorNode,
    right: ASTPreprocessorNode,
  ) {
    super(
      ASTPreprocessorKind.PrefixedOperatorBinary,
      left,
      right,
    );
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
        return BinaryNode.createOptionalBinary(
          ASTPreprocessorKind.BinaryExpression,
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

        return new ASTPrefixOperatorNode(
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

        return new ASTPrefixOperatorNode(
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
        return BinaryNode.createOptionalBinary(
          ASTPreprocessorKind.BinaryExpression,
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

        return new ASTPrefixOperatorNode(
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

        return new ASTPrefixOperatorNode(
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
  return add(g);
}
