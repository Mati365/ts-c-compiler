import {Token} from '@compiler/lexer/tokens';

export type TokensList = Token[] | IterableIterator<Token>;

/**
 * Iterates through tokens list
 *
 * @export
 * @class TokensIterator
 */
export class TokensIterator {
  constructor(
    protected tokens: Token[] = [],
    protected tokenIndex: number = 0,
  ) {}

  get currentToken() { return this.tokens[this.tokenIndex]; }

  getTokens(): Token[] { return this.tokens; }

  getTokenIndex(): number { return this.tokenIndex; }

  /**
   * Fetches precceing token related to current tokenIndex
   *
   * @param {number} [offset=1]
   * @param {boolean} [increment=true]
   * @returns {Token}
   * @memberof TokensIterator
   */
  fetchRelativeToken(offset: number = 1, increment: boolean = true): Token {
    const nextToken = this.tokens[this.tokenIndex + offset];
    if (increment)
      this.tokenIndex += offset;

    return nextToken;
  }

  /**
   * Just increments tokenIndex
   *
   * @see
   *  Returns CURRENT token that was already eaten!
   *
   * @param {number} [count=1]
   * @returns {Token}
   * @memberof TokensIterator
   */
  consume(count: number = 1): Token {
    const prevToken = this.currentToken;
    this.tokenIndex += count;

    return prevToken;
  }

  /**
   * Loops through tokens
   *
   * @param {(token: Token, iterator?: TokensIterator) => any} fn
   * @memberof TokensIterator
   */
  iterate(fn: (token: Token, iterator?: TokensIterator) => any): void {
    const {tokens} = this;

    this.tokenIndex = 0;

    for (; this.tokenIndex < tokens.length; ++this.tokenIndex) {
      const result = fn(
        tokens[this.tokenIndex],
        this,
      );

      if (result === false)
        break;
    }
  }
}
