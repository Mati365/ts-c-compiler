import { NodeLocation, fetchTokensUntilEOL } from '@ts-c-compiler/grammar';
import { TokenType } from '@ts-c-compiler/lexer';

import type { CPreprocessorGrammar } from '../CPreprocessorGrammar';

import { ASTCDefineArg, ASTCDefineNode } from '../../ast/ASTCDefineNode';
import { CPreprocessorIdentifier } from '../CPreprocessorIdentifiers';

export const defineMatcher = ({ g }: CPreprocessorGrammar): ASTCDefineNode => {
  const identifier = g.identifier(CPreprocessorIdentifier.DEFINE);

  const name = g.nonIdentifierKeyword();
  const args: ASTCDefineArg[] = [];

  const bracket = g.match({
    terminal: '(',
    optional: true,
  });

  if (bracket && name.loc.column + name.text.length === bracket.loc.column) {
    const isFullVA = g.match({
      type: TokenType.ELLIPSIS,
      optional: true,
    });

    if (isFullVA) {
      // handle (...)
      args.push({
        name: '__VA_ARGS__',
        va: true,
      });
    } else {
      // handle list of arguments
      do {
        const result = g.match({
          type: TokenType.KEYWORD,
        });

        if (!result) {
          break;
        }

        const isVA = g.match({
          type: TokenType.ELLIPSIS,
          optional: true,
        });

        args.push({
          name: result.text,
          va: !!isVA,
        });

        if (isVA) {
          break;
        }

        const comma = g.match({
          type: TokenType.COMMA,
          optional: true,
        });

        if (!comma) {
          break;
        }
      } while (true);
    }

    g.terminal(')');
  }

  const expression = fetchTokensUntilEOL(g);

  return new ASTCDefineNode(
    NodeLocation.fromTokenLoc(identifier.loc),
    name.text,
    args,
    expression,
  );
};
