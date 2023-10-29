import { isLineTerminatorToken, type Token } from '@ts-c/lexer';
import { TokensIterator } from '../tree/TokensIterator';
import { fetchTokensUntil } from './fetchTokensUntil';

/**
 * Fetch all tokens to end of line
 */
export function fetchTokensUntilEOL(
  parser: TokensIterator,
  excludeBreakToken?: boolean,
): Token[] {
  return fetchTokensUntil(isLineTerminatorToken, parser, excludeBreakToken);
}
