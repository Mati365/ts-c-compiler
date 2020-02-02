import * as R from 'ramda';
import {TokenKind} from '../parser/lexer/tokens';

export const isQuote = (c: string): boolean => c === '"' || c === '\'';

export const matchQuote = (c: string): TokenKind => {
  switch (c) {
    case '\'': return TokenKind.SINGLE_QUOTE;
    case '"': return TokenKind.DOUBLE_QUOTE;

    default:
      return null;
  }
};

export const isBracket = (c: string): boolean => c === '[' || c === ']';

export const matchBracket = (c: string): TokenKind => {
  switch (c) {
    case '(': case ')': return TokenKind.PARENTHES_BRACKET;
    case '{': case '}': return TokenKind.CURLY_BRACKET;
    case '[': case ']': return TokenKind.SQUARE_BRACKET;

    default:
      return null;
  }
};

export const isNewline = R.equals('\n');

export const isWhitespace = R.test(/[\s]/);

export const isOperator = R.test(/[+-/*]/);
