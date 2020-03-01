import * as R from 'ramda';

import {BinaryBlob} from './BinaryBlob';
import {ASTDef} from '../ast/def/ASTDef';
import {Token, TokenType, NumberToken} from '../lexer/tokens';
import {ParserError, ParserErrorCode} from '../../shared/ParserError';

import {
  extractBytesFromText,
  extractMultipleNumberBytes,
} from './utils';

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
