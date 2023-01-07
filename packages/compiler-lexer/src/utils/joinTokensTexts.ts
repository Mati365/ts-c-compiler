import * as R from 'ramda';
import { Token } from '../tokens/Token';

export function joinTokensTexts(separator: string, tokens: Token[]): string {
  return R.pluck('text', tokens).join(separator);
}

/**
 * Bad asm tokens join
 */
export function joinTokensWithSpaces(tokens: Token[], trim?: boolean): string {
  let line = '';
  let cursor = 0;

  for (let i = 0; i < tokens.length; ++i) {
    const token = tokens[i];
    const tokenStr = token.toString();
    if (R.isNil(tokenStr)) {
      break;
    }

    line += ' '.repeat(Math.max(0, token.loc.column - cursor)) + tokenStr;
    cursor = token.loc.column + token.text.length;
  }

  if (trim) {
    line = R.trim(line);
  }

  return line;
}
