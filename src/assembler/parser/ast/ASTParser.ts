import {isWhitespace} from '../../utils/matchCharacter';

import {ParserError, ParserErrorCode} from '../../types/ParserError';
import {Token, TokenType} from '../lexer/tokens';
import {ASTNode} from './ASTNode';

export type ASTInstructionParser = {
  parse(token: Token, parser: ASTParser): ASTNode;
};

/**
 * Creates tree from provided tokens
 *
 * @export
 * @class ASTParser
 */
export class ASTParser {
  private nodeParsers: ASTInstructionParser[];

  private tokens: Token[];
  private tokenIndex: number = 0;

  constructor(
    nodeParsers: ASTInstructionParser[],
    tokensIterator: IterableIterator<Token>,
  ) {
    this.nodeParsers = nodeParsers;
    this.tokens = Array.from(tokensIterator);
  }

  /**
   * Fetches precceing token related to current tokenIndex
   *
   * @param {number} [offset=1]
   * @param {boolean} [increment=true]
   * @returns {Token}
   * @memberof ASTParser
   */
  fetchNextToken(offset: number = 1, increment: boolean = true): Token {
    const nextToken = this.tokens[this.tokenIndex + offset];
    if (increment)
      this.tokenIndex += offset;

    return nextToken;
  }

  /**
   * Fetches array of matched instructions, labels etc
   *
   * @returns {ASTNode[]}
   * @memberof ASTParser
   */
  getTree(): ASTNode[] {
    const {nodeParsers, tokens} = this;
    const astNodes = [];

    this.tokenIndex = 0;

    for (; this.tokenIndex < tokens.length; ++this.tokenIndex) {
      const token = tokens[this.tokenIndex];
      let tokenParsed = false;

      if (token.type === TokenType.EOF)
        break;

      for (let j = 0; j < nodeParsers.length; ++j) {
        try {
          const astNode = nodeParsers[j].parse(token, this);

          if (astNode) {
            astNodes.push(astNode);
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
    }

    return astNodes;
  }
}
