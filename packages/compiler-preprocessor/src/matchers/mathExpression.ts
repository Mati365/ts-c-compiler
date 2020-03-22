/* eslint-disable no-use-before-define, @typescript-eslint/no-use-before-define */
import {empty} from '@compiler/grammar/matchers';

import {TokenType, NumberToken, Token} from '@compiler/lexer/tokens';
import {NodeLocation} from '@compiler/grammar/tree/NodeLocation';

import {ReducePostfixOperatorsVisitor} from './utils/ReducePostifxOperatorsVisitor';
import {
  ASTPreprocessorBinaryOpNode,
  createBinOpIfBothSidesPresent,
} from '../nodes/ASTPreprocessorBinaryOpNode';

import {ASTPreprocessorValueNode} from '../nodes/ASTPreprocessorValueNode';
import {
  PreprocessorGrammar,
  ASTPreprocessorNode,
  ASTPreprocessorKind,
} from '../constants';

/**
 * @see
 * term -> keyword | number | ( expr )
 */
function term(g: PreprocessorGrammar): ASTPreprocessorNode {
  const {currentToken: token} = g;

  if (token.type === TokenType.KEYWORD)
    return keywordTerm(g);

  if (token.type === TokenType.NUMBER) {
    g.consume();
    return new ASTPreprocessorValueNode<NumberToken[]>(
      ASTPreprocessorKind.Value,
      NodeLocation.fromTokenLoc(token.loc),
      [token],
    );
  }

  if (token.type === TokenType.BRACKET && token.text === '(') {
    g.consume();
    const expr = bitsOp(g);
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
 * Macro calls etc
 *
 * @param {PreprocessorGrammar} g
 * @returns {ASTPreprocessorNode}
 */
function keywordTerm(g: PreprocessorGrammar): ASTPreprocessorNode {
  const result: Token[] = [g.currentToken];
  g.consume();

  // macro keyword, fetch keywords list
  if (g.currentToken.text === '(') {
    let nesting = 0;

    g.iterate((token) => {
      result.push(token);

      if (token.text === '(')
        nesting++;
      else if (token.text === ')')
        nesting--;

      return nesting > 0;
    });
    g.consume();
  }

  return new ASTPreprocessorValueNode(
    ASTPreprocessorKind.Value,
    NodeLocation.fromTokenLoc(result[0].loc),
    result,
  );
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
 * @see
 * bitsOp = add bitsOp'
 * bitsOp' = ε
 * bitsOp' = "&" add bitsOp'
 * bitsOp' = "|" add bitsOp'
 * bitsOp' = "<<" add bitsOp'
 * bitsOp' = ">>" add bitsOp'
 */
function bitsOp(g: PreprocessorGrammar): ASTPreprocessorNode {
  return <ASTPreprocessorNode> g.or(
    {
      value() {
        return createBinOpIfBothSidesPresent(
          ASTPreprocessorBinaryOpNode,
          null,
          add(g),
          bitsOpPrim(g),
        );
      },
      empty() {
        return null;
      },
    },
  );
}

function bitsOpPrim(g: PreprocessorGrammar): ASTPreprocessorNode {
  return <ASTPreprocessorNode> g.or(
    {
      and() {
        g.match(
          {
            type: TokenType.BIT_AND,
          },
        );

        return new ASTPreprocessorBinaryOpNode(
          TokenType.BIT_AND,
          add(g),
          bitsOpPrim(g),
        );
      },
      or() {
        g.match(
          {
            type: TokenType.BIT_OR,
          },
        );

        return new ASTPreprocessorBinaryOpNode(
          TokenType.BIT_OR,
          add(g),
          bitsOpPrim(g),
        );
      },
      sl() {
        g.match(
          {
            type: TokenType.BIT_SHIFT_LEFT,
          },
        );

        return new ASTPreprocessorBinaryOpNode(
          TokenType.BIT_SHIFT_LEFT,
          add(g),
          bitsOpPrim(g),
        );
      },
      sr() {
        g.match(
          {
            type: TokenType.BIT_SHIFT_RIGHT,
          },
        );

        return new ASTPreprocessorBinaryOpNode(
          TokenType.BIT_SHIFT_RIGHT,
          add(g),
          bitsOpPrim(g),
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
  const node = bitsOp(g);

  if (reducePostFixOps)
    (new ReducePostfixOperatorsVisitor).visit(node);

  return node;
}
