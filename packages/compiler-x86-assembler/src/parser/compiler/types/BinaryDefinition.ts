import * as R from 'ramda';

import {
  extractBytesFromText,
  extractMultipleNumberBytes,
  toIEEE754Single,
  toIEEE754Double,
  toIEEE754Extended,
} from '@compiler/core/utils';

import {Token, TokenType} from '@compiler/lexer/tokens';
import {BinaryBlob} from '../BinaryBlob';
import {ASTDef, DefTokenNames} from '../../ast/def/ASTDef';
import {NumberToken, FloatNumberToken} from '../../lexer/tokens';
import {ParserError, ParserErrorCode} from '../../../shared/ParserError';

export const FLOAT_DEFINE_ENCODERS = {
  [DefTokenNames.DD]: toIEEE754Single,
  [DefTokenNames.DQ]: toIEEE754Double,
  [DefTokenNames.DT]: toIEEE754Extended,
};

/**
 * Transforms token into binary array of numbers
 *
 * @export
 * @param {number} byteSize
 * @param {Token} token
 * @returns {number[]}
 */
export function encodeDefineToken(byteSize: number, token: Token): number[] {
  const buffer: number[] = [];

  switch (token.type) {
    case TokenType.FLOAT_NUMBER: {
      const encoder = FLOAT_DEFINE_ENCODERS[byteSize];
      if (!encoder) {
        throw new ParserError(
          ParserErrorCode.INCORRECT_FLOAT_SIZE,
          null,
          {
            number: token.text,
          },
        );
      }

      buffer.push(
        ...R.reverse(
          encoder((<FloatNumberToken> token).value.number),
        ),
      );
    } break;

    case TokenType.NUMBER:
      buffer.push(
        ...extractMultipleNumberBytes(byteSize, (<NumberToken> token).value.number),
      );
      break;

    case TokenType.QUOTE:
      buffer.push(
        ...extractBytesFromText(byteSize, token.text),
      );
      break;

    default:
      throw new ParserError(
        ParserErrorCode.UNSUPPORTED_DEFINE_TOKEN,
        null,
        {
          token: token.text,
        },
      );
  }

  return buffer;
}

/**
 * Define binary set of data
 *
 * @export
 * @class BinaryDefinition
 * @extends {BinaryBlob<ASTDef>}
 */
export class BinaryDefinition extends BinaryBlob<ASTDef> {
  /**
   * Compiles set of data into binary stream
   *
   * @returns {BinaryDefinition}
   * @memberof BinaryDefinition
   */
  compile(): BinaryDefinition {
    const {ast: {args, byteSize}} = this;
    const binary: number[] = [];

    R.forEach(
      (arg) => {
        binary.push(...encodeDefineToken(byteSize, arg));
      },
      args,
    );

    this._binary = binary;
    return this;
  }
}
