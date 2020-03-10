import {Token, TokenType} from '@compiler/lexer/tokens';
import {ParserError, ParserErrorCode} from '@compiler/x86-assembler/shared/ParserError';

import {ASTParser} from '../ASTParser';
import {ASTNodeKind} from '../types';
import {
  ASTNodeLocation,
  KindASTNode,
} from '../ASTNode';

import {fetchInstructionTokensArgsList} from '../../utils';

export const EQU_TOKEN_NAME = 'equ';

/**
 * Similar to %define but define label with value
 *
 * @export
 * @class ASTEqu
 * @extends {KindASTNode(ASTNodeKind.EQU)}
 */
export class ASTEqu extends KindASTNode(ASTNodeKind.EQU) {
  constructor(
    public readonly name: string,
    public readonly expression: string,
    loc: ASTNodeLocation,
  ) {
    super(loc);
  }

  toString(): string {
    const {name, expression} = this;
    return `${name} equ ${expression}`;
  }

  static parse(token: Token, parser: ASTParser): ASTEqu {
    if (token.type !== TokenType.KEYWORD)
      return null;

    const nextToken = parser.fetchRelativeToken(1, false);
    if (nextToken.lowerText !== EQU_TOKEN_NAME)
      return null;

    parser.consume();
    const args = fetchInstructionTokensArgsList(parser, false);

    if (args.length !== 1) {
      throw new ParserError(
        ParserErrorCode.INCORRECT_EQU_ARGS_COUNT,
        null,
        {
          count: args.length,
        },
      );
    }

    return new ASTEqu(
      token.text,
      args[0].text,
      ASTNodeLocation.fromTokenLoc(token.loc),
    );
  }
}
