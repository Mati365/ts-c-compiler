/* eslint-disable no-use-before-define, @typescript-eslint/no-use-before-define */
import {empty} from '@compiler/grammar/matchers';
import {isRelationOpToken} from '@compiler/lexer/utils/isRelationOpToken';

import {TokenType} from '@compiler/lexer/tokens';
import {ReducePostfixOperatorsVisitor} from './utils/ReducePostifxOperatorsVisitor';
import {
  ASTCBinaryOpNode, ASTCCompilerNode,
  CCompilerGrammar, createBinOpIfBothSidesPresent,
} from '../ast';

import {mathExpression} from './mathExpression';

/**
 * @see
 * term -> mathExpr | ( logic )
 */
function term(g: CCompilerGrammar): ASTCCompilerNode {
  const {currentToken: token} = g;

  if (token.type === TokenType.BRACKET && token.text === '(') {
    g.consume();
    const expr = mathExpression(g, false);
    g.match(
      {
        type: TokenType.BRACKET,
        terminal: ')',
      },
    );

    return expr;
  }

  return mathExpression(g, false);
}

/**
 * @see
 * rel = term rel'
 * rel = ε
 * rel' = ">" term rel'
 * rel' = "<" term rel'
 * rel' = "<=" term rel'
 * rel' = ">=" term rel'
 */
function relOp(g: CCompilerGrammar): ASTCCompilerNode {
  return <ASTCCompilerNode> g.or(
    {
      rel() {
        return createBinOpIfBothSidesPresent(
          ASTCBinaryOpNode,
          null,
          term(g),
          relOpPrim(g),
        );
      },
      empty,
    },
  );
}

function relOpPrim(g: CCompilerGrammar): ASTCCompilerNode {
  const {currentToken} = g;
  if (!isRelationOpToken(currentToken.type))
    return null;

  g.consume();
  return new ASTCBinaryOpNode(
    currentToken.type,
    term(g),
    relOpPrim(g),
  );
}

/**
 * Creates expression with >, < etc
 *
 * @export
 * @param {CCompilerGrammar} g
 * @param {boolean} [reducePostFixOps=true]
 * @returns {ASTCCompilerNode}
 */
export function relationExpression(g: CCompilerGrammar, reducePostFixOps: boolean = true): ASTCCompilerNode {
  const node = relOp(g);

  if (reducePostFixOps)
    (new ReducePostfixOperatorsVisitor).visit(node);

  return node;
}
