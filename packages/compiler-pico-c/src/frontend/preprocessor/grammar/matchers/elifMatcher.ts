import { NodeLocation } from '@ts-cc/grammar';
import { TokenType } from '@ts-cc/lexer';

import type { CPreprocessorGrammar } from '../CPreprocessorGrammar';

import { CPreprocessorIdentifier } from '../CPreprocessorIdentifiers';
import { ASTCExpressionNode, ASTCElifNode } from 'frontend/preprocessor/ast';

import { logicExpression } from './expressions';

export const elifMatcher = (ctx: CPreprocessorGrammar): ASTCElifNode => {
  const { g, stmt, falseIfStmt } = ctx;

  const identifier = g.identifier(CPreprocessorIdentifier.ELIF);
  const expression = logicExpression(g);

  g.match({
    type: TokenType.EOL,
  });

  const trueStmt = stmt();
  const falseStmt = falseIfStmt();

  return new ASTCElifNode(
    NodeLocation.fromTokenLoc(identifier.loc),
    new ASTCExpressionNode(expression.loc, expression),
    trueStmt,
    falseStmt,
  );
};
