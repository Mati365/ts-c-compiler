import { NodeLocation } from '@ts-c-compiler/grammar';
import { TokenType } from '@ts-c-compiler/lexer';

import type { CPreprocessorGrammar } from '../CPreprocessorGrammar';

import { CPreprocessorIdentifier } from '../CPreprocessorIdentifiers';
import { ASTCIfNode, ASTCExpressionNode } from 'frontend/preprocessor/ast';

import { logicExpression } from './expressions';

export const ifMatcher = (ctx: CPreprocessorGrammar): ASTCIfNode => {
  const { g, stmt, falseIfStmt } = ctx;

  const identifier = g.identifier(CPreprocessorIdentifier.IF);
  const expression = logicExpression(g);

  g.match({
    type: TokenType.EOL,
  });

  const trueStmt = stmt();
  const falseStmt = falseIfStmt();

  g.identifier(CPreprocessorIdentifier.ENDIF);
  g.match({
    type: TokenType.EOL,
  });

  return new ASTCIfNode(
    NodeLocation.fromTokenLoc(identifier.loc),
    new ASTCExpressionNode(expression.loc, expression),
    trueStmt,
    falseStmt,
  );
};
