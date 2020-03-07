import * as R from 'ramda';

import {Token} from '@compiler/lexer/tokens';
import {MathKeywordValueResolver} from '@compiler/rpn/utils/MathExpression';
import {rpn} from '@compiler/rpn/rpn';

/**
 * Concat all tokens text into one string
 *
 * @export
 * @param {Token[]} tokens
 * @returns {string}
 */
export function mergeTokensTexts(tokens: Token[]): string {
  return R.join('', R.pluck('text', tokens));
}

/**
 * Calculate expression using reverse polish notation from several tokens
 *
 * @export
 * @param {Token[]} tokens
 * @param {MathKeywordValueResolver} [keywordResolver]
 * @returns
 */
export function rpnTokens(tokens: Token[], keywordResolver?: MathKeywordValueResolver) {
  return rpn(
    mergeTokensTexts(tokens),
    keywordResolver,
  );
}
