import * as R from 'ramda';

import {BinaryBlob} from './BinaryBlob';
import {ASTDef} from '../ast/def/ASTDef';
import {Token, TokenType, NumberToken} from '../lexer/tokens';
import {ParserError, ParserErrorCode} from '../../shared/ParserError';

import {extractNthByte} from './utils';

/**
 * Extends digit to byteSize number of bytes
 * and emits array of bytes of data
 *
 * @param {number} byteSize
 * @param {number} num
 * @returns {number[]}
 */
function emitExtendedNumber(byteSize: number, num: number): number[] {
  const buffer: number[] = [];

  for (let i = 0; i < byteSize; ++i)
    buffer.push(extractNthByte(i, num));

  return buffer;
}
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
      buffer.push(...emitExtendedNumber(byteSize, (<NumberToken> token).value.number));
      break;

    case TokenType.QUOTE:
      for (let i = 0; i < token.text.length; ++i)
        buffer.push(...emitExtendedNumber(byteSize, token.text.charCodeAt(i)));
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
