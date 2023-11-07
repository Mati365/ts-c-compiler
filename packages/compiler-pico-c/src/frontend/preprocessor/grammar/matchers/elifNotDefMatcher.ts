import { NodeLocation } from '@ts-c-compiler/grammar';
import { TokenType } from '@ts-c-compiler/lexer';

import type { CPreprocessorGrammar } from '../CPreprocessorGrammar';

import { CPreprocessorIdentifier } from '../CPreprocessorIdentifiers';
import { ASTCIfDefNode, ASTCIfNotDefNode } from 'frontend/preprocessor/ast';

export const elifNotDefMatcher = (ctx: CPreprocessorGrammar): ASTCIfDefNode => {
  const { g, stmt, falseIfStmt } = ctx;

  const identifier = g.identifier(CPreprocessorIdentifier.ELIF_NOT_DEF);
  const name = g.match({
    type: TokenType.KEYWORD,
  });

  g.match({
    type: TokenType.EOL,
  });

  const trueStmt = stmt();
  const falseStmt = falseIfStmt();

  return new ASTCIfNotDefNode(
    NodeLocation.fromTokenLoc(identifier.loc),
    name.text,
    trueStmt,
    falseStmt,
  );
};
