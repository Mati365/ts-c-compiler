import * as R from 'ramda';

import {Token, TokenType} from '@compiler/lexer/tokens';
import {MathParserConfig} from '@compiler/rpn/utils/MathExpression';
import {rpn} from '@compiler/rpn/rpn';

import {NumberToken} from '../../lexer/tokens';

/**
 * Concat all tokens text into one string
 *
 * @export
 * @param {Token[]} tokens
 * @returns {string}
 */
export function mergeTokensTexts(tokens: Token[]): string {
  return R.join(
    '',
    R.map(
      (token) => {
        if (token.type === TokenType.QUOTE)
          return `'${token.text}'`;

        if (token.type === TokenType.BRACKET)
          return `(${token.text})`;

        return token.text;
      },
      tokens,
    ),
  );
}

/**
 * Calculate expression using reverse polish notation from several tokens
 *
 * @export
 * @param {Token[]} tokens
 * @param {MathParserConfig} [parserConfig]
 * @returns
 */
export function rpnTokens(tokens: Token[], parserConfig?: MathParserConfig) {
  if (tokens.length === 1 && tokens[0].type === TokenType.NUMBER)
    return (<NumberToken> tokens[0]).value.number;

  return rpn(
    mergeTokensTexts(tokens),
    parserConfig,
  );
}
