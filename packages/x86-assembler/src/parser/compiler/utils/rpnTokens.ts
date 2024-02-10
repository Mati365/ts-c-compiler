import * as R from 'ramda';
import * as E from 'fp-ts/Either';

import { rpn } from '@ts-c-compiler/rpn';
import { MathErrorCode } from '@ts-c-compiler/rpn';

import { MathParserConfig } from '@ts-c-compiler/rpn';
import { Token, TokenType, NumberToken } from '@ts-c-compiler/lexer';
import { ASTExpressionParserError } from '../../ast/critical/ASTExpression';

/**
 * Concat all tokens text into one string
 */
export function mergeTokensTexts(tokens: Token[], joinStr: string = ''): string {
  let acc = '';

  for (let i = 0; i < tokens.length; ++i) {
    const token = tokens[i];

    // prevent something like it: 2--2
    if (
      token.type === TokenType.NUMBER &&
      token instanceof NumberToken &&
      token.value.number < 0 &&
      !Number.isInteger(+acc[i - 1])
    ) {
      acc += `(0${token.value.number})`;
    } else if (token.type === TokenType.QUOTE) {
      acc += `'${token.text}'`;
    } else if (token.type === TokenType.BRACKET) {
      acc += `(${token.text})`;
    } else {
      acc += token.text;
    }

    if (joinStr) {
      acc += joinStr;
    }
  }

  return acc;
}

/**
 * Calculate expression using reverse polish notation from several tokens
 */
export function rpnTokens(tokens: Token[], parserConfig?: MathParserConfig) {
  if (tokens.length === 1 && tokens[0].type === TokenType.NUMBER) {
    return (<NumberToken>tokens[0]).value.number;
  }

  try {
    return rpn(mergeTokensTexts(tokens), parserConfig);
  } catch (e) {
    if (tokens[0] instanceof Token) {
      e.loc = tokens[0].loc;
    }

    throw e;
  }
}

/**
 * RPN parser that throws error only if occurs unresolved keyword
 * it is very helpful in labels and equ
 */
export function safeKeywordResultRPN(
  config: MathParserConfig,
  tokens: Token[] | string,
): E.Either<ASTExpressionParserError, number> {
  try {
    if (R.is(String, tokens)) {
      return E.right(rpn(<string>tokens, config));
    }

    return E.right(rpnTokens(<Token[]>tokens, config));
  } catch (e) {
    if (tokens[0] instanceof Token) {
      e.loc = tokens[0].loc;
    }

    if (
      config?.keywordResolver ||
      ('code' in e && e.code !== MathErrorCode.UNKNOWN_KEYWORD)
    ) {
      throw e;
    }

    return E.left(ASTExpressionParserError.UNRESOLVED_LABEL);
  }
}
