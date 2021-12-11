import {FloatNumberToken, Token, TokenType} from '@compiler/lexer/tokens';

function isFloatingPointPartToken(token: Token) {
  if (!token)
    return false;

  return (
    token.type === TokenType.KEYWORD
      || token.type === TokenType.NUMBER
      || token.type === TokenType.FLOAT_NUMBER
  );
}

/**
 * Due to C syntax we have random_struct.a = 2 and 2.5f
 * syntax constructions, do not treat 2.5f as separate tokens
 * but random_struct.a so. This token parser just runs over
 * list of tokens and merges floating point keywords.
 *
 * @see
 *  Maybe it should be moved directly to lexer?
 *
 * @param {Token} tokens
 * @returns {Token[]}
 */
export function cMergeNumbersTokens(tokens: Token[]): Token[] {
  const mapped: Token[] = [];
  const {length: total} = tokens;

  for (let i = 0; i < total; ++i) {
    const token = tokens[i];

    // detect floating point tokens and concat them
    // fix case when dot can be interpreted both as digit
    // or struct member
    if (isFloatingPointPartToken(token)
        && tokens[i + 1]?.type === TokenType.DOT
        && isFloatingPointPartToken(tokens[i + 2])) {
      const text = `${token.text}.${tokens[i + 2].text}`;

      mapped.push(
        FloatNumberToken.parse(text, token.loc),
      );

      i += 2;
    } else
      mapped.push(token);
  }

  return mapped;
}
