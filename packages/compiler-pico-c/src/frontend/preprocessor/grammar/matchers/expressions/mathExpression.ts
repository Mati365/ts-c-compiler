/* eslint-disable no-use-before-define, @typescript-eslint/no-use-before-define */
import { TokenType, NumberToken, Token } from '@ts-cc/lexer';
import { NodeLocation } from '@ts-cc/grammar';
import { SyntaxError } from '@ts-cc/grammar';

import type { CPreprocessorGrammarDef } from '../../CPreprocessorGrammar';
import {
  ASTPreprocessorBinaryOpNode,
  ASTCValueNode,
  type ASTCPreprocessorTreeNode,
} from 'frontend/preprocessor/ast';

import {
  PreprocessorReducePostfixOperatorsVisitor,
  createLeftRecursiveOperatorMatcher,
} from './utils';

/**
 * @see
 * num -> keyword | number | ( expr )
 */
function num(g: CPreprocessorGrammarDef): ASTCPreprocessorTreeNode {
  const { currentToken: token } = g;

  if (token.type === TokenType.KEYWORD) {
    return keywordTerm(g);
  }

  if (token.type === TokenType.NUMBER) {
    g.consume();
    return new ASTCValueNode<NumberToken[]>(NodeLocation.fromTokenLoc(token.loc), [
      token,
    ]);
  }

  if (token.type === TokenType.BRACKET && token.text === '(') {
    g.consume();
    const expr = orBitwiseOp(g);
    g.match({
      type: TokenType.BRACKET,
      terminal: ')',
    });

    return expr;
  }

  throw new SyntaxError();
}

/**
 * Handles sign first
 *
 * @see
 *  term -> num | +num | -num
 */
function term(g: CPreprocessorGrammarDef): ASTCPreprocessorTreeNode {
  const { currentToken: token } = g;

  switch (token.type) {
    case TokenType.PLUS:
    case TokenType.MINUS:
      g.consume();

      return new ASTPreprocessorBinaryOpNode(
        token.type,
        new ASTCValueNode<NumberToken[]>(NodeLocation.fromTokenLoc(token.loc), [
          new NumberToken('0', 0, null, token.loc),
        ]),
        term(g),
      );

    default:
  }

  return num(g);
}

/**
 * Macro calls etc
 */
function keywordTerm(g: CPreprocessorGrammarDef): ASTCPreprocessorTreeNode {
  const result: Token[] = [g.currentToken];
  g.consume();

  // macro keyword, fetch keywords list
  if (g.currentToken.text === '(') {
    let nesting = 0;

    g.iterate(token => {
      result.push(token);

      if (token.text === '(') {
        nesting++;
      } else if (token.text === ')') {
        nesting--;
      }

      return nesting > 0;
    });
    g.consume();
  }

  return new ASTCValueNode(NodeLocation.fromTokenLoc(result[0].loc), result);
}

const mul = createLeftRecursiveOperatorMatcher({
  parentExpression: term,
  operator: [TokenType.MUL, TokenType.DIV, TokenType.MOD],
}).op;

const add = createLeftRecursiveOperatorMatcher({
  parentExpression: mul,
  operator: [TokenType.PLUS, TokenType.MINUS],
}).op;

const andBitwiseOp = createLeftRecursiveOperatorMatcher({
  operator: TokenType.BIT_AND,
  parentExpression: add,
}).op;

const xorBitwiseOp = createLeftRecursiveOperatorMatcher({
  operator: TokenType.POW,
  parentExpression: andBitwiseOp,
}).op;

const orBitwiseOp = createLeftRecursiveOperatorMatcher({
  operator: TokenType.BIT_OR,
  parentExpression: xorBitwiseOp,
}).op;

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
 */
export function mathExpression(
  g: CPreprocessorGrammarDef,
  reducePostFixOps: boolean = true,
): ASTCPreprocessorTreeNode {
  const node = orBitwiseOp(g);

  if (reducePostFixOps) {
    new PreprocessorReducePostfixOperatorsVisitor().visit(node);
  }

  return node;
}
