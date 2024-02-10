import * as R from 'ramda';

import { parseNumberToken, isQuote } from '@ts-c-compiler/lexer';
import { reduceTextToBitset } from '@ts-c-compiler/core';

import { MathOperator } from './MathOperators';
import { MathError, MathErrorCode } from './MathError';

export type MathPostfixTokens = (string | MathOperator)[];

export type MathParserConfig = {
  keywordResolver?: (name: string) => number;
};

/**
 * Converts array of postifx tokens into single string
 */
export function joinPostifxTokens(tokens: MathPostfixTokens): string {
  return R.reduce(
    (acc, token) => {
      const char = token instanceof MathOperator ? token.char : token;

      return acc ? `${acc} ${char}` : char;
    },
    '',
    tokens,
  );
}

/**
 * Replaces all quotes in string to ascii numbers
 */
export function replaceQuotesWithNumbers(expression: string): string {
  for (let i = 0; i < expression.length; ++i) {
    const c = expression[i];

    if (isQuote(c)) {
      let quoteBuffer = '';

      for (let j = i + 1; j < expression.length && !isQuote(expression[j]); ++j) {
        quoteBuffer += expression[j];
      }

      expression =
        expression.slice(0, i) +
        reduceTextToBitset(quoteBuffer) +
        expression.slice(i + quoteBuffer.length + 2);
    }
  }

  return expression;
}

/**
 * Concerts expression to RPN and calculates it
 */
export class MathExpression {
  /**
   * Calculates expression
   */
  static evaluate(phrase: string, parserConfig?: MathParserConfig): number {
    return MathExpression.reducePostfixToNumber(
      MathExpression.toRPN(phrase),
      parserConfig,
    );
  }

  /**
   * Transforms expression to postfix
   */
  static toRPN(phrase: string): MathPostfixTokens {
    const stack: MathOperator[] = [];
    const buffer: MathPostfixTokens = [];
    const tokens: string[] = R.reject(
      R.isEmpty,
      R.split(
        MathOperator.MATCH_OPERATOR_REGEX,
        replaceQuotesWithNumbers(phrase).replace(/\s/g, ''),
      ),
    );

    for (let i = 0; i < tokens.length; ++i) {
      let c = tokens[i];
      let operator = MathOperator.findOperatorByCharacter(c);

      // handle <<
      if (!operator) {
        operator = MathOperator.findOperatorByCharacter(c + tokens[i + 1]);
        if (operator) {
          ++i;
          c += tokens[i + 1];
        }
      }

      if (operator) {
        // prefix cases with 0: (-1), +1+2
        if (
          (operator === MathOperator.PLUS || operator === MathOperator.MINUS) &&
          (!i ||
            (tokens[i - 1] &&
              MathOperator.findOperatorByCharacter(tokens[i - 1]) ===
                MathOperator.LEFT_BRACKET))
        ) {
          buffer.push('0');
        }

        if (operator === MathOperator.RIGHT_BRACKET) {
          let foundLeftBracket = false;
          while (stack.length) {
            const stackOperator = R.last(stack);
            if (stackOperator === MathOperator.LEFT_BRACKET) {
              stack.pop();
              foundLeftBracket = true;
              break;
            }

            buffer.push(stack.pop());
          }

          if (!foundLeftBracket) {
            throw new MathError(MathErrorCode.MISSING_LEFT_BRACKET);
          }
        } else if (operator === MathOperator.LEFT_BRACKET) {
          stack.push(operator);
        } else {
          // drop when right hand priority stack operator on stack < operator priority
          // drop when left hand priority stack operator on stack >= operator priority
          while (stack.length) {
            const stackOperator = R.last(stack);

            // check priority
            if (
              (!operator.rightHand && operator.priority <= stackOperator.priority) ||
              (operator.rightHand && operator.priority < stackOperator.priority)
            ) {
              buffer.push(stack.pop());
            } else {
              break;
            }
          }

          stack.push(operator);
        }
      } else {
        buffer.push(c);
      }
    }

    while (stack.length) {
      const token = stack.pop();
      if (token === MathOperator.RIGHT_BRACKET || token === MathOperator.LEFT_BRACKET) {
        throw new MathError(MathErrorCode.INCORRECT_BRACKETS);
      }

      buffer.push(token);
    }

    return buffer;
  }

  /**
   * Calculates value of postfix expression
   */
  static reducePostfixToNumber(
    tokens: MathPostfixTokens,
    parserConfig?: MathParserConfig,
  ): number {
    const numberStack: number[] = [];

    for (let i = 0; i < tokens.length; ++i) {
      const token = tokens[i];

      if (token instanceof MathOperator) {
        // handle ++2 digit, it should be 2
        // -2 should be 0-2
        const missingArgs = token.argsCount - numberStack.length;

        if (missingArgs > 0) {
          if (token === MathOperator.PLUS || token === MathOperator.MINUS) {
            R.times(() => {
              numberStack.unshift(0);
            }, missingArgs);
          } else {
            throw new MathError(MathErrorCode.MISSING_OPERANDS);
          }
        }

        const args = numberStack.splice(
          numberStack.length - token.argsCount,
          token.argsCount,
        );

        numberStack.push(token.resolver(args));
      } else {
        const nestedLabel = token && token[0] === '.';
        let number = nestedLabel ? NaN : +token;

        if (Number.isNaN(number)) {
          // parsing using custom parser is slower than just `+${digit}`
          // so it is second parse method
          const parsedNumber = !nestedLabel && parseNumberToken(token);

          if (parsedNumber) {
            [, number] = parsedNumber;
          } else {
            number = parserConfig?.keywordResolver?.(token);
            if (R.isNil(number)) {
              throw new MathError(MathErrorCode.UNKNOWN_KEYWORD, { token });
            }
          }
        }

        numberStack.push(number);
      }
    }

    return R.last(numberStack) ?? null;
  }
}
