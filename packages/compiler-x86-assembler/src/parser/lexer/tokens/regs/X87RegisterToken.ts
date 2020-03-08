import * as R from 'ramda';

import {
  TokenLocation,
  TokenType,
  Token,
  TokenKind,
} from '@compiler/lexer/tokens';

import {
  X87_COMPILER_REGISTERS_SET,
  X87StackRegisterSchema,
} from '../../../../constants/registersSet/x87';

type X87StackRegisterTokenValue = {
  schema: X87StackRegisterSchema,
};

/**
 * Register token used in FPU operations (such as ST0, ST1 etc)
 *
 * @export
 * @class X87StackRegisterToken
 * @extends {Token<X87StackRegisterTokenValue>}
 */
export class X87StackRegisterToken extends Token<X87StackRegisterTokenValue> {
  constructor(
    text: string,
    schema: X87StackRegisterSchema,
    loc: TokenLocation,
  ) {
    super(
      TokenType.KEYWORD,
      TokenKind.X87_REGISTER,
      text,
      loc,
      {
        schema,
      },
    );
  }

  /**
   * @todo
   *  Add support for status register?
   *
   * @static
   * @param {string} token
   * @param {TokenLocation} loc
   * @returns {X87StackRegisterToken}
   * @memberof X87StackRegisterToken
   */
  static parse(token: string, loc: TokenLocation): X87StackRegisterToken {
    const schema = X87_COMPILER_REGISTERS_SET[R.toLower(token)];
    if (schema)
      return new X87StackRegisterToken(token, schema, loc.clone());

    return null;
  }
}
