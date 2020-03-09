import * as R from 'ramda';

import {Token, TokenType} from '@compiler/lexer/tokens';

import {ParserError, ParserErrorCode} from '../../../shared/ParserError';
import {ASTParser} from '../ASTParser';
import {ASTNodeKind} from '../types';
import {InstructionArgSize} from '../../../types';
import {NumberToken} from '../../lexer/tokens';
import {
  ASTNodeLocation,
  KindASTNode,
} from '../ASTNode';

import {
  fetchInstructionTokensArgsList,
  toStringArgsList,
} from '../../utils';

export enum DefTokenNames {
  DB = InstructionArgSize.BYTE,
  DW = InstructionArgSize.WORD,
  DD = InstructionArgSize.DWORD,
  DQ = InstructionArgSize.QWORD,
  DT = InstructionArgSize.TWORD,
}

/**
 * Checks if token is size def, if so - return size
 *
 * @export
 * @param {Token} token
 * @returns {number}
 */
export function tokenDefSize(token: Token): number {
  if (token.type !== TokenType.KEYWORD)
    return null;

  return DefTokenNames[token.upperText];
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

  clone(): ASTDef {
    const {byteSize, args, loc} = this;

    return new ASTDef(byteSize, args, loc);
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
    const tokenSize: number = tokenDefSize(token);
    if (!tokenSize)
      return null;

    // pick all args
    const argsTokens = fetchInstructionTokensArgsList(parser, false);

    // throw error if any number exceddes token def size
    // todo: check strings?
    R.forEach(
      (arg) => {
        if (arg.type !== TokenType.NUMBER)
          return;

        const numberToken = <NumberToken> arg;
        if (numberToken.value.byteSize > tokenSize) {
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
      tokenSize,
      argsTokens,
      ASTNodeLocation.fromTokenLoc(token.loc),
    );
  }
}
