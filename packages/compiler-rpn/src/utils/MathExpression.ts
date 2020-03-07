import * as R from 'ramda';

import {MathOperator} from './MathOperators';
import {MathError, MathErrorCode} from './MathError';

export type MathPostfixTokens = (string|MathOperator)[];

export type MathKeywordValueResolver = (name: string) => number;

/**
 * Concerts expression to RPN and calculates it
 *
 * @export
 * @class MathExpression
 */
export class MathExpression {
  /**
   * Calculates expression
   *
   * @static
   * @param {string} phrase
   * @param {MathKeywordValueResolver} [keywordResolver]
   * @returns {number}
   * @memberof MathExpression
   */
  static evaluate(phrase: string, keywordResolver?: MathKeywordValueResolver): number {
    return MathExpression.reducePostfixToNumber(
      MathExpression.toRPN(phrase),
      keywordResolver,
    );
  }

  /**
   * Transforms expression to postfix
   *
   * @static
   * @param {string} phrase
   * @returns {MathPostfixTokens}
   * @memberof MathExpression
   */
  static toRPN(phrase: string): MathPostfixTokens {
    const stack: MathOperator[] = [];
    const buffer: MathPostfixTokens = [];
    const tokens: string[] = R.split(
      MathOperator.MATCH_OPERATOR_REGEX,
      phrase.replace(/\s/g, ''),
    );

    for (let i = 0; i < tokens.length; ++i) {
      const c = tokens[i];
      if (R.isEmpty(c))
        continue;

      const operator = MathOperator.findOperatorByCharacter(c);
      if (operator) {
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

          if (!foundLeftBracket)
            throw new MathError(MathErrorCode.MISSING_LEFT_BRACKET);
        } else if (operator === MathOperator.LEFT_BRACKET)
          stack.push(operator);
        else {
          // drop when right hand priority stack operator on stack < operator priority
          // drop when left hand priority stack operator on stack >= operator priority
          while (stack.length) {
            const stackOperator = R.last(stack);

            // check priority
            if ((!operator.rightHand && operator.priority <= stackOperator.priority)
                || (operator.rightHand && operator.priority < stackOperator.priority))
              buffer.push(stack.pop());
            else
              break;
          }

          stack.push(operator);
        }
      } else
        buffer.push(c);
    }

    while (stack.length) {
      const token = stack.pop();
      if (token === MathOperator.RIGHT_BRACKET || token === MathOperator.LEFT_BRACKET)
        throw new MathError(MathErrorCode.INCORRECT_BRACKETS);

      buffer.push(token);
    }

    return buffer;
  }

  /**
   * Calculates value of postfix expression
   *
   * @static
   * @param {MathPostfixTokens} tokens
   * @param {MathKeywordValueResolver} [keywordResolver]
   * @returns {number}
   * @memberof MathExpression
   */
  static reducePostfixToNumber(tokens: MathPostfixTokens, keywordResolver?: MathKeywordValueResolver): number {
    const numberStack: number[] = [];

    for (let i = 0; i < tokens.length; ++i) {
      const token = tokens[i];

      if (token instanceof MathOperator) {
        if (token.argsCount > numberStack.length)
          throw new MathError(MathErrorCode.MISSING_OPERANDS);

        const args = numberStack.splice(
          numberStack.length - token.argsCount,
          token.argsCount,
        );

        numberStack.push(
          token.resolver(args),
        );
      } else {
        let number = +token;

        if (Number.isNaN(number)) {
          number = keywordResolver?.(token);
          if (R.isNil(number))
            throw new MathError(MathErrorCode.UNKNOWN_KEYWORD, {token});
        }

        numberStack.push(number);
      }
    }

    return R.last(numberStack) ?? null;
  }
}
