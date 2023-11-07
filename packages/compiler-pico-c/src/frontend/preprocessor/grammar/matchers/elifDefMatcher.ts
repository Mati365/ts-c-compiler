import { NodeLocation } from '@ts-c-compiler/grammar';
import { TokenType } from '@ts-c-compiler/lexer';

import type { CPreprocessorGrammar } from '../CPreprocessorGrammar';

import { CPreprocessorIdentifier } from '../CPreprocessorIdentifiers';
import { ASTCElifDefNode } from 'frontend/preprocessor/ast';

export const elifDefMatcher = (ctx: CPreprocessorGrammar): ASTCElifDefNode => {
  const { g, stmt, falseIfStmt } = ctx;

  const identifier = g.identifier(CPreprocessorIdentifier.ELIF_DEF);
  const name = g.match({
    type: TokenType.KEYWORD,
  });

  g.match({
    type: TokenType.EOL,
  });

  const trueStmt = stmt();
  const falseStmt = falseIfStmt();

  return new ASTCElifDefNode(
    NodeLocation.fromTokenLoc(identifier.loc),
    name.text,
    trueStmt,
    falseStmt,
  );
};
