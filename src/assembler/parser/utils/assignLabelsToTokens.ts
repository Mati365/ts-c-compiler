import * as R from 'ramda';

import {ParserErrorCode, ParserError} from '../../shared/ParserError';
import {isPossibleLabelToken} from './isPossibleLabelToken';
import {ASTLabelAddrResolver} from '../ast/instruction/ASTResolvableArg';
import {Token, NumberFormat, NumberToken} from '../lexer/tokens';

/**
 * Replaces all tokens in list with label (which is simple number)
 *
 * @export
 * @param {ASTLabelAddrResolver} labelResolver
 * @param {Token<any>[]} tokens
 * @returns
 */
export function assignLabelsToTokens(labelResolver: ASTLabelAddrResolver, tokens: Token<any>[]) {
  if (!labelResolver)
    return tokens;

  return R.map(
    (token) => {
      if (!isPossibleLabelToken(token))
        return token;

      const labelAddress = labelResolver(token.text);
      if (R.isNil(labelAddress)) {
        throw new ParserError(
          ParserErrorCode.UNKNOWN_LABEL,
          null,
          {
            label: token.text,
          },
        );
      }

      return new NumberToken(token.text, labelAddress, NumberFormat.DEC, token.loc);
    },
    tokens,
  );
}

/**
 * Check if there is token in args list
 *
 * @export
 * @param {Token[]} tokens
 * @returns {boolean}
 */
export function isAnyLabelInTokensList(tokens: Token[]): boolean {
  return R.any(isPossibleLabelToken, tokens);
}
