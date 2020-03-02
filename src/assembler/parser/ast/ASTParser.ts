import {isWhitespace} from '../../utils/matchCharacter';

import {ParserError, ParserErrorCode} from '../../shared/ParserError';
import {Token, TokenType} from '../lexer/tokens';
import {ASTNode} from './ASTNode';

/**
 * Iterates through tokens list
 *
 * @export
 * @class ASTTokensIterator
 */
export class ASTTokensIterator {
  constructor(
    protected tokens: Token[],
    protected tokenIndex: number = 0,
  ) {}

  getTokenIndex(): number { return this.tokenIndex; }

  /**
   * Fetches precceing token related to current tokenIndex
   *
   * @param {number} [offset=1]
   * @param {boolean} [increment=true]
   * @returns {Token}
   * @memberof ASTTokensIterator
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
   * @param {number} [count=1]
   * @returns {Token}
   * @memberof ASTTokensIterator
   */
  consume(count: number = 1): Token {
    return this.fetchRelativeToken(count);
  }

  /**
   * Loops through tokens
   *
   * @param {(token: Token, iterator?: ASTTokensIterator) => any} fn
   * @memberof ASTTokensIterator
   */
  iterate(fn: (token: Token, iterator?: ASTTokensIterator) => any): void {
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

/**
 * @todo
 *  Add more metadata about tree
 *
 * @export
 * @class ASTTree
 */
export class ASTTree {
  constructor(
    public astNodes: ASTNode[] = [],
  ) {}
}

export type ASTInstructionParser = {
  parse(token: Token, parser: ASTParser, tree: ASTTree): ASTNode;
};

/**
 * Creates tree from provided tokens
 *
 * @export
 * @class ASTParser
 * @extends {ASTTokensIterator}
 */
export class ASTParser extends ASTTokensIterator {
  constructor(
    private nodeParsers: ASTInstructionParser[],
    tokensIterator: IterableIterator<Token>,
  ) {
    super(Array.from(tokensIterator));
  }

  /**
   * Fetches array of matched instructions, labels etc
   *
   * @returns {ASTTree}
   * @memberof ASTParser
   */
  getTree(): ASTTree {
    const {nodeParsers} = this;
    const tree = new ASTTree;

    this.iterate(
      (token) => {
        let tokenParsed = false;

        if (token.type === TokenType.EOF)
          return false;

        for (let j = 0; j < nodeParsers.length; ++j) {
          try {
            const astNode = nodeParsers[j].parse(token, this, tree);

            if (astNode) {
              tree.astNodes.push(astNode);
              tokenParsed = true;
              break;
            }
          } catch (e) {
            console.error(`(${token.loc.toString()}): ${e.message}`);
            return null;
          }
        }

        if (!tokenParsed && !isWhitespace(<string> token.text))
          throw new ParserError(ParserErrorCode.UNKNOWN_OPERATION, token.loc);

        return true;
      },
    );

    return tree;
  }
}
