import { isLineTerminatorToken } from '@ts-c-compiler/lexer';

import { Token, TokenType } from '@ts-c-compiler/lexer';
import { TokensIterator } from '@ts-c-compiler/grammar';

import { PreprocessorError, PreprocessorErrorCode } from '../../PreprocessorError';

/**
 * Extracts args from expressions such as:
 * abc(1, 2, 3)
 *
 * Similar to extractNestableTokensList but handles also commas
 */
export function fetchRuntimeCallArgsList(
  parser: TokensIterator,
  minBracketNestingArgsSeparator: number = 1,
): Token[][] {
  const args: Token[][] = [];
  let buffer: Token[] = [];
  let bracketNesting: number = 0;

  parser.iterate(token => {
    if (bracketNesting > 0 && isLineTerminatorToken(token)) {
      throw new PreprocessorError(PreprocessorErrorCode.UNTERMINATED_ARGS_LIST);
    }

    if (token.text === '(') {
      bracketNesting++;
      if (bracketNesting > 1) {
        buffer.push(token);
      }
    } else if (token.text === ')') {
      bracketNesting--;

      if (bracketNesting > 0) {
        buffer.push(token);
      } else if (bracketNesting === 0) {
        return false;
      }
    } else if (
      bracketNesting === minBracketNestingArgsSeparator &&
      token.type === TokenType.COMMA
    ) {
      if (!buffer.length) {
        throw new PreprocessorError(PreprocessorErrorCode.INCORRECT_ARGS_LIST);
      }

      args.push(buffer);
      buffer = [];
    } else {
      buffer.push(token);
    }

    return true;
  });

  if (buffer.length) {
    args.push(buffer);
  }

  return args;
}
