import * as R from 'ramda';

import {ParserError, ParserErrorCode} from '../../../shared/ParserError';
import {ASTParser} from '../ASTParser';
import {ASTNodeKind} from '../types';
import {InstructionArgSize} from '../../../types';
import {Token, TokenType, NumberToken} from '../../lexer/tokens';
import {
  ASTNodeLocation,
  KindASTNode,
} from '../ASTNode';

import {
  fetchTokensArgsList,
  toStringArgsList,
} from '../instruction/ASTInstruction';

export enum DefTokenNames {
  DB = InstructionArgSize.BYTE,
  DW = InstructionArgSize.WORD,
  DQ = InstructionArgSize.DWORD,
}

/**
 * Used to define binary data variables
 *
 * @export
 * @class ASTDef
 * @extends {KindASTNode(ASTNodeKind.DEFINE)}
 */
export class ASTDef extends KindASTNode(ASTNodeKind.DEFINE) {
  constructor(
    public readonly byteSize: number,
    public readonly args: Token[],
    loc: ASTNodeLocation,
  ) {
    super(loc);
  }

  /**
   * @returns {string}
   * @memberof ASTInstruction
   */
  toString(): string {
    const {byteSize, args} = this;

    return toStringArgsList(
      DefTokenNames[byteSize],
      args,
    );
  }

  /**
   * Defines binary data
   *
   * @static
   * @param {Token} token
   * @param {ASTParser} parser
   * @returns {ASTLabel}
   * @memberof ASTLabel
   */
  static parse(token: Token, parser: ASTParser): ASTDef {
    if (token.type !== TokenType.KEYWORD)
      return null;

    // check definition size
    const tokenDefSize: number = DefTokenNames[R.toUpper(token.text)];
    if (!tokenDefSize)
      return null;

    // pick all args
    const argsTokens = fetchTokensArgsList(parser, false);

    // throw error if any number exceddes token def size
    // todo: check strings?
    R.forEach(
      (arg) => {
        if (arg.type !== TokenType.NUMBER)
          return;

        const numberToken = <NumberToken> arg;
        if (numberToken.value.byteSize > tokenDefSize) {
          throw new ParserError(
            ParserErrorCode.DEFINED_DATA_EXCEEDES_BOUNDS,
            null,
            {
              data: numberToken.text,
              maxSize: tokenDefSize,
            },
          );
        }
      },
      argsTokens,
    );

    return new ASTDef(
      tokenDefSize,
      argsTokens,
      ASTNodeLocation.fromTokenLoc(token.loc),
    );
  }
}
