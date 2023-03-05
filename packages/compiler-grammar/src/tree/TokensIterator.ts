import { Token } from '@compiler/lexer/tokens';

export type TokensList = Token[] | IterableIterator<Token>;

/**
 * Iterates through tokens list
 */
export class TokensIterator {
  constructor(
    protected tokens: Token[] = [],
    protected tokenIndex: number = 0,
  ) {}

  get currentToken() {
    return this.tokens[this.tokenIndex];
  }

  getTokens(): Token[] {
    return this.tokens;
  }

  getTokenIndex(): number {
    return this.tokenIndex;
  }

  setTokenIndex(tokenIndex: number): void {
    this.tokenIndex = tokenIndex;
  }

  /**
   * Gets list of tokens consumed by function
   */
  getConsumedTokensList(fn: VoidFunction): Token[] {
    const { tokenIndex: startIndex, tokens } = this;

    fn();
    return tokens.slice(startIndex, this.tokenIndex);
  }

  /**
   * Fetches precceing token related to current tokenIndex
   */
  fetchRelativeToken(offset: number = 1, increment: boolean = true): Token {
    const nextToken = this.tokens[this.tokenIndex + offset];
    if (increment) {
      this.tokenIndex += offset;
    }

    return nextToken;
  }

  /**
   * Fetches next token to current
   */
  nextToken(increment: boolean = false): Token {
    return this.fetchRelativeToken(1, increment);
  }

  /**
   * Fetches previous token
   */
  prevToken(decrement: boolean = false): Token {
    return this.fetchRelativeToken(-1, decrement);
  }

  /**
   * Just increments tokenIndex
   *
   * @see
   *  Returns CURRENT token that was already eaten!
   */
  consume(count: number = 1): Token {
    const prevToken = this.currentToken;
    this.tokenIndex += count;

    return prevToken;
  }

  /**
   * Loops through tokens
   */
  iterate(fn: (token: Token, iterator?: TokensIterator) => any): void {
    const { tokens } = this;

    for (; this.tokenIndex < tokens.length; ++this.tokenIndex) {
      const result = fn(tokens[this.tokenIndex], this);

      if (result === false) {
        break;
      }
    }
  }
}
