/* eslint-disable no-use-before-define, @typescript-eslint/no-use-before-define */
import {empty} from '@compiler/grammar/matchers';

import {ValueNode} from '@compiler/grammar/tree/TreeNode';
import {TokenType, NumberToken} from '@compiler/lexer/tokens';
import {NodeLocation} from '@compiler/grammar/tree/NodeLocation';

import {ReducePostfixOperatorsVisitor} from './utils/ReducePostifxOperatorsVisitor';
import {
  ASTPreprocessorBinaryOpNode,
  createBinOpIfBothSidesPresent,
} from '../nodes/ASTPreprocessorBinaryOpNode';

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
          ASTPreprocessorBinaryOpNode,
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

        return new ASTPreprocessorBinaryOpNode(
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

        return new ASTPreprocessorBinaryOpNode(
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
          ASTPreprocessorBinaryOpNode,
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

        return new ASTPreprocessorBinaryOpNode(
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

        return new ASTPreprocessorBinaryOpNode(
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
 * @param {boolean} [reducePostFixOps=true]
 * @returns {ASTPreprocessorNode}
 */
export function mathExpression(g: PreprocessorGrammar, reducePostFixOps: boolean = true): ASTPreprocessorNode {
  const node = add(g);

  if (reducePostFixOps)
    (new ReducePostfixOperatorsVisitor).visit(node);

  return node;
}
