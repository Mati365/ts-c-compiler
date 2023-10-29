import * as R from 'ramda';

import { isLineTerminatorToken } from '@ts-c/lexer';

import { Token } from '@ts-c/lexer';
import { NodeLocation } from '@ts-c/grammar';

import { ParserError, ParserErrorCode } from '../../../shared/ParserError';
import { ASTAsmParser, ASTAsmTree } from '../ASTAsmParser';
import { ASTNodeKind } from '../types';
import { KindASTAsmNode } from '../ASTAsmNode';

import { isTokenInstructionBeginning } from '../instruction/utils/isTokenInstructionBeginning';
import { tokenDefSize } from '../def/ASTDef';

export const TIMES_TOKEN_NAME = 'times';

/**
 * Instruction that repeats instruction
 */
export class ASTTimes extends KindASTAsmNode(ASTNodeKind.TIMES) {
  constructor(
    readonly timesExpression: Token[],
    readonly repatedNodesTree: ASTAsmTree,
    loc: NodeLocation,
  ) {
    super(loc);
  }

  toString(): string {
    return `${TIMES_TOKEN_NAME} ${this.timesExpression.join('')}`;
  }

  /**
   * Parses line - consumes expression unless catch any instruction beginning
   */
  static parse(token: Token, parser: ASTAsmParser): ASTTimes {
    if (token.lowerText !== TIMES_TOKEN_NAME) {
      return null;
    }

    const timesExpression: Token[] = [];
    let repeatedNodeTokens: Token[] = null;

    // divide line tokens into times expression and repeated node expression
    do {
      const argToken = parser.fetchRelativeToken();
      if (!argToken) {
        break;
      }

      if (
        !repeatedNodeTokens &&
        (isTokenInstructionBeginning(argToken) || tokenDefSize(argToken))
      ) {
        repeatedNodeTokens = [argToken];
      } else if (isLineTerminatorToken(argToken)) {
        break;
      } else {
        (repeatedNodeTokens || timesExpression).push(argToken);
      }
    } while (true);

    // handle errors
    if (!timesExpression.length) {
      throw new ParserError(
        ParserErrorCode.INCORRECT_TIMES_ARGS_COUNT,
        token.loc,
      );
    }

    if (!repeatedNodeTokens?.length) {
      throw new ParserError(
        ParserErrorCode.MISSING_TIMES_REPEATED_INSTRUCTION,
        token.loc,
      );
    }

    // try generate AST for repeated instruction
    const repatedNodesTreeResult = parser.fork(repeatedNodeTokens).getTree();

    if (repatedNodesTreeResult.isOk()) {
      const repatedNodesTree = repatedNodesTreeResult.unwrap();

      if (!repatedNodesTree?.astNodes?.[0]) {
        throw new ParserError(
          ParserErrorCode.UNABLE_PARSE_REPEATED_INSTRUCTION,
          token.loc,
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
        repatedNodesTree,
        NodeLocation.fromTokenLoc(token.loc),
      );
    }

    // raise error, it should be single error because single instruction
    throw repatedNodesTreeResult.unwrapErr()[0];
  }
}
