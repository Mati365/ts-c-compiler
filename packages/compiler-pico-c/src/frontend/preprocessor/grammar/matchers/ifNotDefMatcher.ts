import { NodeLocation } from '@ts-c-compiler/grammar';
import { TokenType } from '@ts-c-compiler/lexer';

import type { CPreprocessorGrammar } from '../CPreprocessorGrammar';

import { CPreprocessorIdentifier } from '../CPreprocessorIdentifiers';
import { ASTCIfDefNode, ASTCIfNotDefNode } from 'frontend/preprocessor/ast';

export const ifNotDefMatcher = ({
  g,
  stmt,
}: CPreprocessorGrammar): ASTCIfDefNode => {
  const identifier = g.identifier(CPreprocessorIdentifier.IF_NOT_DEF);
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

  return new ASTCIfNotDefNode(
    NodeLocation.fromTokenLoc(identifier.loc),
    name.text,
    trueStmt,
    falseStmt,
  );
};
