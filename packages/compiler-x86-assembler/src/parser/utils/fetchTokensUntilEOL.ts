import {isLineTerminatorToken} from '@compiler/lexer/utils';

import {Token} from '@compiler/lexer/tokens';
import {TokensIterator} from '@compiler/grammar/tree/TokensIterator';

/**
 * Fetch all tokens to end of line
 *
 * @export
 * @param {TokensIterator} parser
 * @returns {Token[]}
 */
export function fetchTokensUntilEOL(parser: TokensIterator): Token[] {
  const tokens: Token[] = [];

  do {
    const token = parser.consume();
    if (!token || isLineTerminatorToken(token))
      break;

    tokens.push(token);
  } while (true);

  return tokens;
}
