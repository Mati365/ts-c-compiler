/* eslint-disable no-use-before-define, @typescript-eslint/no-use-before-define */
import {empty} from '@compiler/grammar/matchers';

import {TokenType} from '@compiler/lexer/tokens';
import {createBinOpIfBothSidesPresent, ASTCBinaryOpNode} from '../ast/ASTCBinaryNode';

import {ReducePostfixOperatorsVisitor} from './utils/ReducePostifxOperatorsVisitor';
import {ASTCCompilerNode, CCompilerGrammar} from '../ast';
import {relationExpression} from './relationExpression';

/**
 * @see
 * term -> relation | ( logic )
 */
function term(g: CCompilerGrammar): ASTCCompilerNode {
  const {currentToken: token} = g;

  if (token.type === TokenType.BRACKET && token.text === '(') {
    g.consume();
    const expr = orOp(g);
    g.match(
      {
        type: TokenType.BRACKET,
        terminal: ')',
      },
    );

    return expr;
  }

  return relationExpression(g, false);
}

/**
 * @see
 * and = term and'
 * and = ε
 * and' = "&&" term and'
 */
function andOp(g: CCompilerGrammar): ASTCCompilerNode {
  return <ASTCBinaryOpNode> g.or(
    {
      and() {
        return createBinOpIfBothSidesPresent(
          ASTCBinaryOpNode,
          null,
          term(g),
          andOpPrim(g),
        );
      },
      empty,
    },
  );
}

function andOpPrim(g: CCompilerGrammar): ASTCCompilerNode {
  return <ASTCCompilerNode> g.or(
    {
      and() {
        g.match(
          {
            type: TokenType.AND,
          },
        );

        return new ASTCBinaryOpNode(
          TokenType.AND,
          term(g),
          andOpPrim(g),
        );
      },
      empty,
    },
  );
}

/**
 * @see
 * or = and or'
 * or = ε
 * or' = "||" and or'
 */
function orOp(g: CCompilerGrammar): ASTCCompilerNode {
  return <ASTCCompilerNode> g.or(
    {
      value() {
        return createBinOpIfBothSidesPresent(
          ASTCBinaryOpNode,
          null,
          andOp(g),
          orOpPrim(g),
        );
      },
      empty,
    },
  );
}

function orOpPrim(g: CCompilerGrammar): ASTCCompilerNode {
  return <ASTCCompilerNode> g.or(
    {
      or() {
        g.match(
          {
            type: TokenType.OR,
          },
        );

        return new ASTCBinaryOpNode(
          TokenType.OR,
          andOp(g),
          orOpPrim(g),
        );
      },
      empty,
    },
  );
}

/**
 * Creates tree of advanced &&, || operators
 *
 * @export
 * @param {PreprocessorGrammar} g
 * @param {boolean} [reducePostFixOps=true]
 * @returns {ASTPreprocessorNode}
 */
export function logicExpression(g: CCompilerGrammar, reducePostFixOps: boolean = true): ASTCCompilerNode {
  const node = orOp(g);

  if (reducePostFixOps)
    (new ReducePostfixOperatorsVisitor).visit(node);

  return node;
}
