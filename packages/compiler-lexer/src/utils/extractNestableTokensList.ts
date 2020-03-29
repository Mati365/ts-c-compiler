import {Token} from '../tokens';

/**
 * Fetches tokens list that might contain
 * nested subserts of the same tokens list
 *
 * e.g.:
 * [[abc], [abc2]] should match [[abc], [abc2]] not [[abc]
 *
 *
 * @export
 * @param {{
 *     up(token: Token): boolean,
 *     down(token: Token): boolean,
 *   }} fetchUntil
 * @param {Token[]} tokens
 * @param {number} offset
 * @returns {[Token[], number]}
 */
export function extractNestableTokensList(
  fetchUntil: {
    up(token: Token): boolean,
    down(token: Token): boolean,
  },
  tokens: Token[],
  offset: number,
): [Token[], number] {
  const {length} = tokens;
  const {up, down} = fetchUntil;

  const tokenBuffer: Token[] = [];
  let nesting = 0;

  for (;; ++offset) {
    if (offset >= length)
      break;

    const token = tokens[offset];
    if (up(token))
      nesting++;

    if (nesting > 0)
      tokenBuffer.push(token);

    if (down(token))
      nesting--;

    if (nesting < 0)
      break;
  }

  return [tokenBuffer, offset + 1];
}
