import {isLineTerminatorToken} from '@compiler/lexer/utils';

import {Token} from '@compiler/lexer/tokens';
import {TokensIterator} from '@compiler/grammar/tree/TokensIterator';

/**
 * Fetch tokens until breakFn is not true
 *
 * @export
 * @param {(token: Token) => boolean} breakFn
 * @param {TokensIterator} parser
 * @returns {Token[]}
 */
export function fetchTokensUntil(
  breakFn: (token: Token) => boolean,
  parser: TokensIterator,
): Token[] {
  const tokens: Token[] = [];

  do {
    const token = parser.consume();
    if (!token || breakFn(token))
      break;

    tokens.push(token);
  } while (true);

  return tokens;
}


/**
 * Fetch all tokens to end of line
 *
 * @export
 * @param {TokensIterator} parser
 * @returns {Token[]}
 */
export function fetchTokensUntilEOL(parser: TokensIterator): Token[] {
  return fetchTokensUntil(isLineTerminatorToken, parser);
}
