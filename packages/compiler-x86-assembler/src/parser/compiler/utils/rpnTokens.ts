import * as R from 'ramda';

import {rpn} from '@compiler/rpn/rpn';
import {MathErrorCode} from '@compiler/rpn/utils';

import {Result} from '@compiler/core/monads/Result';
import {Token, TokenType} from '@compiler/lexer/tokens';
import {MathParserConfig} from '@compiler/rpn/utils/MathExpression';
import {NumberToken} from '../../lexer/tokens';

import {
  ok,
  err,
  ASTExpressionParserError,
} from '../../ast/critical/ASTExpression';

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

/**
 * RPN parser that throws error only if occurs unresolved keyword
 * it is very helpful in labels and equ
 *
 * @param {MathParserConfig} config
 * @param {Token[]|string} tokens
 * @returns {Result<number, ASTExpressionParserError>}
 */
export function safeKeywordResultRPN(
  config: MathParserConfig,
  tokens: Token[]|string,
): Result<number, ASTExpressionParserError> {
  try {
    if (R.is(String, tokens)) {
      return ok(
        rpn(<string> tokens, config),
      );
    }

    return ok(
      rpnTokens(<Token[]> tokens, config),
    );
  } catch (e) {
    if (config?.keywordResolver || ('code' in e && e.code !== MathErrorCode.UNKNOWN_KEYWORD))
      throw e;

    return err(ASTExpressionParserError.UNRESOLVED_LABEL);
  }
}
