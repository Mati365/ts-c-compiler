import { NodeLocation } from '@ts-cc/grammar';
import { TokenType } from '@ts-cc/lexer';

import type { CPreprocessorGrammar } from '../CPreprocessorGrammar';

import { CPreprocessorIdentifier } from '../CPreprocessorIdentifiers';
import { ASTCIfDefNode } from 'frontend/preprocessor/ast';

export const ifDefMatcher = (ctx: CPreprocessorGrammar): ASTCIfDefNode => {
  const { g, stmt, falseIfStmt } = ctx;

  const identifier = g.identifier(CPreprocessorIdentifier.IF_DEF);
  const name = g.match({
    type: TokenType.KEYWORD,
  });

  g.match({
    type: TokenType.EOL,
  });

  const trueStmt = stmt();
  const falseStmt = falseIfStmt();

  g.identifier(CPreprocessorIdentifier.ENDIF);
  g.match({
    type: TokenType.EOL,
  });

  return new ASTCIfDefNode(
    NodeLocation.fromTokenLoc(identifier.loc),
    name.text,
    trueStmt,
    falseStmt,
  );
};
