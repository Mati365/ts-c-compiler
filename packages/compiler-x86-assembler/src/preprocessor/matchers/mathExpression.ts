/* eslint-disable no-use-before-define, @typescript-eslint/no-use-before-define */
import {TokenType, NumberToken, Token} from '@compiler/lexer/tokens';
import {NodeLocation} from '@compiler/grammar/tree/NodeLocation';

import {ASTPreprocessorBinaryOpNode} from '../nodes/ASTPreprocessorBinaryOpNode';
import {ASTPreprocessorValueNode} from '../nodes/ASTPreprocessorValueNode';
import {
  PreprocessorGrammar,
  ASTPreprocessorNode,
  ASTPreprocessorKind,
} from '../constants';

import {
  PreprocessorReducePostfixOperatorsVisitor,
  createLeftRecursiveOperatorMatcher,
} from './utils';

/**
 * @see
 * num -> keyword | number | ( expr )
 */
function num(g: PreprocessorGrammar): ASTPreprocessorNode {
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
    const expr = orBitwiseOp(g);
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
 * Handles sign first
 *
 * @see
 *  term -> num | +num | -num
 *
 * @param {PreprocessorGrammar} g
 * @returns {ASTPreprocessorNode}
 */
function term(g: PreprocessorGrammar): ASTPreprocessorNode {
  const {currentToken: token} = g;

  switch (token.type) {
    case TokenType.PLUS:
    case TokenType.MINUS:
      g.consume();

      return new ASTPreprocessorBinaryOpNode(
        token.type,
        new ASTPreprocessorValueNode<NumberToken[]>(
          ASTPreprocessorKind.Value,
          NodeLocation.fromTokenLoc(token.loc),
          [
            new NumberToken('0', 0, null, token.loc),
          ],
        ),
        term(g),
      );

    default:
  }

  return num(g);
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

const mul = createLeftRecursiveOperatorMatcher(
  {
    parentExpression: term,
    operator: [
      TokenType.MUL,
      TokenType.DIV,
      TokenType.MOD,
    ],
  },
).op;

const add = createLeftRecursiveOperatorMatcher(
  {
    parentExpression: mul,
    operator: [
      TokenType.PLUS,
      TokenType.MINUS,
    ],
  },
).op;

const andBitwiseOp = createLeftRecursiveOperatorMatcher(
  {
    operator: TokenType.BIT_AND,
    parentExpression: add,
  },
).op;

const xorBitwiseOp = createLeftRecursiveOperatorMatcher(
  {
    operator: TokenType.POW,
    parentExpression: andBitwiseOp,
  },
).op;

const orBitwiseOp = createLeftRecursiveOperatorMatcher(
  {
    operator: TokenType.BIT_OR,
    parentExpression: xorBitwiseOp,
  },
).op;

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
  const node = orBitwiseOp(g);

  if (reducePostFixOps)
    (new PreprocessorReducePostfixOperatorsVisitor).visit(node);

  return node;
}
