import { pipe } from 'fp-ts/function';

import { NodeLocation, fetchTokensUntilEOL } from '@ts-c-compiler/grammar';
import { TokenType, joinTokensTexts } from '@ts-c-compiler/lexer';

import type { CPreprocessorGrammar } from '../CPreprocessorGrammar';

import { ASTCDefineNode } from '../../ast/ASTCDefineNode';
import { CPreprocessorIdentifier } from '../CPreprocessorIdentifiers';

export const defineMatcher = ({ g }: CPreprocessorGrammar): ASTCDefineNode => {
  const identifier = g.identifier(CPreprocessorIdentifier.DEFINE);

  const name = g.nonIdentifierKeyword();
  const args: string[] = [];

  const bracket = g.match({
    terminal: '(',
    optional: true,
  });

  if (bracket && name.loc.column + name.text.length === bracket.loc.column) {
    do {
      const result = g.match({
        type: TokenType.KEYWORD,
      });

      if (!result) {
        break;
      }

      args.push(result.text);

      const comma = g.match({
        type: TokenType.COMMA,
        optional: true,
      });

      if (!comma) {
        break;
      }
    } while (true);

    g.terminal(')');
  }

  const expression = pipe(fetchTokensUntilEOL(g), tokens =>
    joinTokensTexts('', tokens),
  );

  return new ASTCDefineNode(
    NodeLocation.fromTokenLoc(identifier.loc),
    name.text,
    args,
    expression,
  );
};
