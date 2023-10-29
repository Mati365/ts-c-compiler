import * as R from 'ramda';

import { rpn } from '@ts-c/rpn';
import { MathErrorCode } from '@ts-c/rpn';

import { Token, NumberFormat, NumberToken } from '@ts-c/lexer';

import { ParserErrorCode, ParserError } from '../../shared/ParserError';
import { ASTLabelAddrResolver } from '../ast/instruction/ASTResolvableArg';
import { isPossibleLabelToken } from './isPossibleLabelToken';

/**
 * Replaces all tokens in list with label (which is simple number)
 */
export function assignLabelsToTokens(
  labelResolver: ASTLabelAddrResolver,
  tokens: Token<any>[],
  config?: {
    preserveOriginalText?: boolean;
    preserveIfError?: boolean;
  },
) {
  if (!labelResolver && !config?.preserveOriginalText) {
    return tokens;
  }

  return R.map(token => {
    if (!isPossibleLabelToken(token)) {
      return token;
    }

    let labelAddress: number = null;

    try {
      labelAddress = rpn(token.text, {
        keywordResolver: labelResolver,
      });
    } catch (e) {
      if (config?.preserveIfError && e.code === MathErrorCode.UNKNOWN_KEYWORD) {
        return token;
      }

      throw e;
    }

    if (R.isNil(labelAddress)) {
      if (!labelResolver) {
        return token;
      }

      throw new ParserError(ParserErrorCode.UNKNOWN_LABEL, token.loc, {
        label: token.text,
      });
    }

    const newToken = new NumberToken(
      config?.preserveOriginalText ? token.text : labelAddress.toString(),
      labelAddress,
      NumberFormat.DEC,
      token.loc,
    );

    newToken.originalToken = token;
    return newToken;
  }, tokens);
}

/**
 * Check if there is token in args list
 */
export function isAnyLabelInTokensList(tokens: Token[]): boolean {
  return R.any(isPossibleLabelToken, tokens);
}
