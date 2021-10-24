import {TokenKind} from '../shared/TokenTypes';

export function matchQuote(c: string): TokenKind {
  switch (c) {
    case '\'': return TokenKind.SINGLE_QUOTE;
    case '"': return TokenKind.DOUBLE_QUOTE;

    default:
      return null;
  }
}

export function toStringQuoteToken(c: TokenKind): string {
  switch (c) {
    case TokenKind.SINGLE_QUOTE: return '\'';
    case TokenKind.DOUBLE_QUOTE: return '"';

    default:
      return null;
  }
}

export function flipBracket(c: string): string {
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
}

export function matchBracket(c: string): TokenKind {
  switch (c) {
    case '(': case ')': return TokenKind.PARENTHES_BRACKET;
    case '{': case '}': return TokenKind.CURLY_BRACKET;
    case '[': case ']': return TokenKind.SQUARE_BRACKET;

    default:
      return null;
  }
}

export function toStringBracketToken(c: string, flip: boolean = false): string {
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
}

export function isQuote(c: string): boolean {
  return c === '"' || c === '\'';
}

export function isWhitespace(c: string): boolean {
  return c === ' ' || c === '\t' || c === '\n';
}

export function isSign(c: string): boolean {
  return c === '+' || c === '-';
}

export function isNewline(c: string) {
  return c === '\n';
}

export function isComment(c: string) {
  return c === ';' || c === '#';
}
