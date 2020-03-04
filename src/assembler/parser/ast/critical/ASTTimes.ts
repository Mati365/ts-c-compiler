import * as R from 'ramda';

import {ParserError, ParserErrorCode} from '../../../shared/ParserError';
import {Token, TokenType} from '../../lexer/tokens';

import {ASTParser} from '../ASTParser';
import {ASTNodeKind} from '../types';
import {
  ASTNodeLocation,
  KindASTNode,
  ASTNode,
} from '../ASTNode';

import {isTokenInstructionBeginning} from '../instruction/ASTInstruction';
import {tokenDefSize} from '../def/ASTDef';

export const TIMES_TOKEN_NAME = 'times';

/**
 * Instruction that repeats instruction
 *
 * @export
 * @class ASTTimes
 * @extends {KindASTNode(ASTNodeKind.TIMES)}
 */
export class ASTTimes extends KindASTNode(ASTNodeKind.TIMES) {
  constructor(
    public readonly timesExpression: Token[],
    public readonly repeatedNode: ASTNode,
    loc: ASTNodeLocation,
  ) {
    super(loc);
  }

  toString(): string {
    return `${TIMES_TOKEN_NAME} ${this.timesExpression.join('')}`;
  }

  /**
   * Parses line - consumes expression unless catch any instruction beginning
   *
   * @static
   * @param {Token} token
   * @param {ASTParser} parser
   * @returns {ASTTimes}
   * @memberof ASTTimes
   */
  static parse(token: Token, parser: ASTParser): ASTTimes {
    if (token.lowerText !== TIMES_TOKEN_NAME)
      return null;

    const timesExpression: Token[] = [];
    let repeatedNodeTokens: Token[] = null;

    // divide line tokens into times expression and repeated node expression
    do {
      const argToken = parser.fetchRelativeToken();

      if (!repeatedNodeTokens && (isTokenInstructionBeginning(argToken) || tokenDefSize(argToken.text))) {
        repeatedNodeTokens = [argToken];
      } else if (argToken.type === TokenType.EOF || argToken.type === TokenType.EOL)
        break;
      else
        (repeatedNodeTokens || timesExpression).push(argToken);
    } while (true);

    // handle errors
    if (!timesExpression.length)
      throw new ParserError(ParserErrorCode.INCORRECT_TIMES_ARGS_COUNT);

    if (!repeatedNodeTokens.length)
      throw new ParserError(ParserErrorCode.MISSING_TIMES_REPEATED_INSTRUCTION);

    // try generate AST for repeated instruction
    const repeatedNode = (
      parser
        .fork(repeatedNodeTokens)
        .getTree()
        ?.astNodes?.[0]
    );

    if (!repeatedNode) {
      throw new ParserError(
        ParserErrorCode.UNABLE_PARSE_REPEATED_INSTRUCTION,
        null,
        {
          expression: R.compose(
            R.join(' '),
            R.pluck('text'),
          )(repeatedNodeTokens),
        },
      );
    }

    return new ASTTimes(
      timesExpression,
      repeatedNode,
      ASTNodeLocation.fromTokenLoc(token.loc),
    );
  }
}
