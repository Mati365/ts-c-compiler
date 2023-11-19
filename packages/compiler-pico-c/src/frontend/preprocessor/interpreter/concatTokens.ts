import { Token, TokenType } from '@ts-c-compiler/lexer';

/**
 * Concat tokens using `##` join operator
 */
export const concatTokens = (tokens: Token[]): Token[] => {
  const result = [...tokens];

  for (let i = 0; i < result.length; ) {
    const prev = result[i - 1];
    const current = result[i];
    const next = result[i + 1];

    if (current.text !== '##') {
      ++i;
      continue;
    }

    if (prev || next) {
      result[i] = new Token(
        TokenType.KEYWORD,
        null,
        (prev?.text ?? '') + (next?.text ?? ''),
        prev.loc,
      );

      result.splice(i - 1, 1);
      result.splice(i, 1);
    }
  }

  return result;
};
