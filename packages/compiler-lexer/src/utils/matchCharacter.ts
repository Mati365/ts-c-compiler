import * as R from 'ramda';
import {TokenKind} from '../tokens';

export const isQuote = (c: string): boolean => c === '"' || c === '\'';

export const matchQuote = (c: string): TokenKind => {
  switch (c) {
    case '\'': return TokenKind.SINGLE_QUOTE;
    case '"': return TokenKind.DOUBLE_QUOTE;

    default:
      return null;
  }
};

export const toStringQuoteToken = (c: TokenKind): string => {
  switch (c) {
    case TokenKind.SINGLE_QUOTE: return '\'';
    case TokenKind.DOUBLE_QUOTE: return '"';

    default:
      return null;
  }
};

export const flipBracket = (c: string): string => {
  switch (c) {
    case '(': return ')';
    case '{': return '}';
    case '[': return ']';

    case ')': return '(';
    case '}': return '{';
    case ']': return '[';

    default:
      return null;
  }
};

export const matchBracket = (c: string): TokenKind => {
  switch (c) {
    case '(': case ')': return TokenKind.PARENTHES_BRACKET;
    case '{': case '}': return TokenKind.CURLY_BRACKET;
    case '[': case ']': return TokenKind.SQUARE_BRACKET;

    default:
      return null;
  }
};

export const toStringBracketToken = (c: string, flip: boolean = false): string => {
  let character = null;

  switch (c) {
    case TokenKind.PARENTHES_BRACKET: character = '('; break;
    case TokenKind.CURLY_BRACKET: character = '{'; break;
    case TokenKind.SQUARE_BRACKET: character = '['; break;

    default:
      return null;
  }

  return (
    flip
      ? flipBracket(character)
      : character
  );
};

export const isNewline = R.equals('\n');

export const isWhitespace = R.test(/[\s]/);

export const isOperator = R.test(/[+-/*]/);

export const isComment = R.test(/[;#]/);

export function isSign(c: string): boolean {
  return c === '+' || c === '-';
}
