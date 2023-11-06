import { NodeLocation } from '@ts-c-compiler/grammar';
import { TokenType } from '@ts-c-compiler/lexer';

import type { CPreprocessorGrammar } from '../CPreprocessorGrammar';

import { CPreprocessorIdentifier } from '../CPreprocessorIdentifiers';
import { ASTCIfDefNode } from 'frontend/preprocessor/ast';

export const ifDefMatcher = ({
  g,
  stmt,
}: CPreprocessorGrammar): ASTCIfDefNode => {
  const identifier = g.identifier(CPreprocessorIdentifier.IF_DEF);
  const name = g.match({
    type: TokenType.KEYWORD,
  });

  g.match({
    type: TokenType.EOL,
  });

  const trueStmt = stmt();
  const falseStmt = (() => {
    if (g.identifier(CPreprocessorIdentifier.ELSE, true)) {
      return stmt();
    }

    return null;
  })();

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
