/* eslint-disable no-use-before-define, @typescript-eslint/no-use-before-define */
import {empty} from '@compiler/grammar/matchers';

import {TokenType, NumberToken, Token} from '@compiler/lexer/tokens';
import {NodeLocation} from '@compiler/grammar/tree/NodeLocation';

import {PreprocessorReducePostfixOperatorsVisitor} from './utils/PreprocessorReducePostifxOperatorsVisitor';
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
 * Prevents right recursion on same level operaotrs such as 2-2-2-2.
 * Those operators creates tree that is bigger on right
 *
 * @see {@link https://en.wikipedia.org/wiki/Left_recursion}
 *
 * @export
 * @param {PreprocessorGrammar} g
 * @param {ASTPreprocessorBinaryOpNode} root
 * @param {TokenType[]} sameLevelTokensTypes
 * @param {(g: PreprocessorGrammar) => ASTPreprocessorNode} highProduction
 * @param {(g: PreprocessorGrammar) => ASTPreprocessorNode} primProduction
 * @returns
 */
export function eatLeftRecursiveOperators(
  g: PreprocessorGrammar,
  root: ASTPreprocessorBinaryOpNode,
  sameLevelTokensTypes: TokenType[],
  highProduction: (g: PreprocessorGrammar) => ASTPreprocessorNode,
  primProduction: (g: PreprocessorGrammar) => ASTPreprocessorNode,
) {
  // kill right recursion and make it left
  for (;;) {
    const nextTokenType = g.fetchRelativeToken(0x0, false)?.type;
    if (sameLevelTokensTypes.indexOf(nextTokenType) === -1)
      break;

    const token = g.consume();
    root.left = new ASTPreprocessorBinaryOpNode(root.op, root.left, root.right).getSingleSideIfOnlyOne();
    root.op = token.type;
    root.right = highProduction(g);
  }

  if (root.right)
    root.left = root.clone();

  root.right = primProduction(g);
  return root.getSingleSideIfOnlyOne();
}

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
        const root = new ASTPreprocessorBinaryOpNode(
          null,
          term(g),
          null,
        );

        return eatLeftRecursiveOperators(
          g,
          root,
          [TokenType.MUL, TokenType.DIV],
          term,
          mulPrim,
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
        const root = new ASTPreprocessorBinaryOpNode(
          null,
          mul(g),
          null,
        );

        return eatLeftRecursiveOperators(
          g,
          root,
          [TokenType.PLUS, TokenType.MINUS],
          mul,
          addPrim,
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
    (new PreprocessorReducePostfixOperatorsVisitor).visit(node);

  return node;
}
