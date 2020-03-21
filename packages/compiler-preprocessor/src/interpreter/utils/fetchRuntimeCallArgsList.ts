import {isLineTerminatorToken} from '@compiler/lexer/utils/isLineTerminatorToken';

import {Token, TokenType} from '@compiler/lexer/tokens';
import {TokensIterator} from '@compiler/grammar/tree/TokensIterator';
import {
  GrammarError,
  GrammarErrorCode,
} from '@compiler/grammar/GrammarError';

/**
 * Extracts args from expressions such as:
 * abc(1, 2, 3)
 *
 * @export
 * @param {TokensIterator} parser
 * @returns {Token[][]}
 */
export function fetchRuntimeCallArgsList(parser: TokensIterator): Token[][] {
  const args: Token[][] = [];
  let buffer: Token[] = [];
  let bracketNesting: number = 0;

  parser.iterate((token) => {
    if (isLineTerminatorToken(token))
      throw new GrammarError(GrammarErrorCode.UNTERMINATED_ARGS_LIST);

    if (token.text === '(') {
      bracketNesting++;
      if (bracketNesting > 1)
        buffer.push(token);
    } else if (token.text === ')') {
      bracketNesting--;
      if (bracketNesting === 0)
        return false;

      buffer.push(token);
    } else if (token.type === TokenType.COMMA) {
      if (!buffer.length)
        throw new GrammarError(GrammarErrorCode.INCORRECT_ARGS_LIST);

      args.push(buffer);
      buffer = [];
    } else
      buffer.push(token);

    return true;
  });

  if (buffer.length)
    args.push(buffer);

  return args;
}
