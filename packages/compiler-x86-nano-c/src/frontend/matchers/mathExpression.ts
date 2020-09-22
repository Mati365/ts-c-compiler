/* eslint-disable no-use-before-define, @typescript-eslint/no-use-before-define */
import {empty} from '@compiler/grammar/matchers';

import {TokenType, NumberToken, Token} from '@compiler/lexer/tokens';
import {NodeLocation} from '@compiler/grammar/tree/NodeLocation';

import {ReducePostfixOperatorsVisitor} from './utils/ReducePostifxOperatorsVisitor';
import {
  ASTCBinaryOpNode, ASTCCompilerKind,
  ASTCCompilerNode, ASTCValueNode,
  CCompilerGrammar, createBinOpIfBothSidesPresent,
} from '../ast';

/**
 * Prevents right recursion on same level operaotrs such as 2-2-2-2.
 * Those operators creates tree that is bigger on right
 *
 * @see {@link https://en.wikipedia.org/wiki/Left_recursion}
 *
 * @export
 * @param {CCompilerGrammar} g
 * @param {ASTCBinaryOpNode} root
 * @param {TokenType[]} sameLevelTokensTypes
 * @param {(g: CCompilerGrammar) => ASTCCompilerNode} highProduction
 * @param {(g: CCompilerGrammar) => ASTCCompilerNode} primProduction
 * @returns
 */
export function eatLeftRecursiveOperators(
  g: CCompilerGrammar,
  root: ASTCBinaryOpNode,
  sameLevelTokensTypes: TokenType[],
  highProduction: (g: CCompilerGrammar) => ASTCCompilerNode,
  primProduction: (g: CCompilerGrammar) => ASTCCompilerNode,
) {
  // kill right recursion and make it left
  for (;;) {
    const nextTokenType = g.fetchRelativeToken(0x0, false)?.type;
    if (sameLevelTokensTypes.indexOf(nextTokenType) === -1)
      break;

    const token = g.consume();
    root.left = new ASTCBinaryOpNode(root.op, root.left, root.right).getSingleSideIfOnlyOne();
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
function num(g: CCompilerGrammar): ASTCCompilerNode {
  const {currentToken: token} = g;

  if (token.type === TokenType.KEYWORD)
    return keywordTerm(g);

  if (token.type === TokenType.NUMBER) {
    g.consume();
    return new ASTCValueNode<NumberToken[]>(
      ASTCCompilerKind.Value,
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
 * @param {CCompilerGrammar} g
 * @returns {ASTCCompilerNode}
 */
function term(g: CCompilerGrammar): ASTCCompilerNode {
  const {currentToken: token} = g;

  switch (token.type) {
    case TokenType.PLUS:
    case TokenType.MINUS:
      g.consume();

      return new ASTCBinaryOpNode(
        token.type,
        new ASTCValueNode<NumberToken[]>(
          ASTCCompilerKind.Value,
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
 * @param {CCompilerGrammar} g
 * @returns {ASTCCompilerNode}
 */
function keywordTerm(g: CCompilerGrammar): ASTCCompilerNode {
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

  return new ASTCValueNode(
    ASTCCompilerKind.Value,
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
function mul(g: CCompilerGrammar): ASTCCompilerNode {
  return <ASTCCompilerNode> g.or(
    {
      value() {
        const root = new ASTCBinaryOpNode(
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

function mulPrim(g: CCompilerGrammar): ASTCCompilerNode {
  return <ASTCCompilerNode> g.or(
    {
      mul() {
        g.match(
          {
            type: TokenType.MUL,
          },
        );

        return new ASTCBinaryOpNode(
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

        return new ASTCBinaryOpNode(
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
function add(g: CCompilerGrammar): ASTCCompilerNode {
  return <ASTCCompilerNode> g.or(
    {
      value() {
        const root = new ASTCBinaryOpNode(
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

function addPrim(g: CCompilerGrammar): ASTCCompilerNode {
  return <ASTCCompilerNode> g.or(
    {
      add() {
        g.match(
          {
            type: TokenType.PLUS,
          },
        );

        return new ASTCBinaryOpNode(
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

        return new ASTCBinaryOpNode(
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
function bitsOp(g: CCompilerGrammar): ASTCCompilerNode {
  return <ASTCCompilerNode> g.or(
    {
      value() {
        return createBinOpIfBothSidesPresent(
          ASTCBinaryOpNode,
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

function bitsOpPrim(g: CCompilerGrammar): ASTCCompilerNode {
  return <ASTCCompilerNode> g.or(
    {
      and() {
        g.match(
          {
            type: TokenType.BIT_AND,
          },
        );

        return new ASTCBinaryOpNode(
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

        return new ASTCBinaryOpNode(
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

        return new ASTCBinaryOpNode(
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

        return new ASTCBinaryOpNode(
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
 * @param {CCompilerGrammar} g
 * @param {boolean} [reducePostFixOps=true]
 * @returns {ASTCCompilerNode}
 */
export function mathExpression(g: CCompilerGrammar, reducePostFixOps: boolean = true): ASTCCompilerNode {
  const node = bitsOp(g);

  if (reducePostFixOps)
    (new ReducePostfixOperatorsVisitor).visit(node);

  return node;
}
