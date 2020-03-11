import {isWhitespace} from '@compiler/lexer/utils/matchCharacter';

import {Token, TokenType} from '@compiler/lexer/tokens';
import {Result, err, ok} from '@compiler/core/monads/Result';
import {CompilerError} from '@compiler/core/shared/CompilerError';

import {ParserError, ParserErrorCode} from '../../shared/ParserError';
import {ASTNode} from './ASTNode';

export type ASTLexerTokensList = Token[]|IterableIterator<Token>;

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

  getTokens(): Token[] { return this.tokens; }

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
    tokensIterator: ASTLexerTokensList,
  ) {
    super(
      'length' in tokensIterator
        ? <Token[]> tokensIterator
        : Array.from(tokensIterator),
    );
  }

  getParsers() { return this.nodeParsers; }

  /**
   * Creates clone of ASTParser but with new tokens list,
   * used in some nested parsers like TIMES
   *
   * @param {ASTLexerTokensList} tokensIterator
   * @memberof ASTParser
   */
  fork(tokensIterator: ASTLexerTokensList): ASTParser {
    return new ASTParser(this.nodeParsers, tokensIterator);
  }

  /**
   * Fetches array of matched instructions, labels etc
   *
   * @returns {Result<ASTTree, CompilerError[]>}
   * @memberof ASTParser
   */
  getTree(): Result<ASTTree, CompilerError[]> {
    const {nodeParsers} = this;
    const tree = new ASTTree;
    const errors: CompilerError[] = [];

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
            e.loc = token.loc;
            errors.push(e);
          }
        }

        if (!tokenParsed && !isWhitespace(<string> token.text)) {
          errors.push(
            new ParserError(
              ParserErrorCode.UNKNOWN_OPERATION,
              token.loc,
              {
                operation: token.text,
              },
            ),
          );
        }

        return true;
      },
    );

    return (
      errors.length
        ? err(errors)
        : ok(tree)
    );
  }
}
