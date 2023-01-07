import * as R from 'ramda';

import { MathExpression, joinPostifxTokens } from '../src/utils/MathExpression';
import { MathErrorCode } from '../src/utils';

import { rpn } from '../src/rpn';

describe('transform', () => {
  it('transforms expression to postfix form', () => {
    const TEST_EXPRESSIONS = [
      ['2+2', '2 2 +'],
      ['2.2+2.3', '2.2 2.3 +'],
      ['2 + 2 / 3', '2 2 3 / +'],
      [
        '((15 / (7 - (1 + 1))) * 3) - (2 + (1 + 1))',
        '15 7 1 1 + - / 3 * 2 1 1 + + -',
      ],
      ['2 << 3', '2 3 <<'],
    ];

    TEST_EXPRESSIONS.forEach(([normal, postfix]) => {
      expect(joinPostifxTokens(MathExpression.toRPN(normal))).toBe(postfix);
    });
  });
});

describe('output value', () => {
  it('calculates non-keyword expressions', () => {
    [
      ['2+2', 4],
      ['2.2+2.3', 4.5],
      ['2 + 2 / 3', 2 + 2 / 3],
      ['((15 / (7 - (1 + 1))) * 3) - (2 + (1 + 1))', 5],
      ['2 << 3 + 4', 256],
      ['(2 << 3) + 4', 20],
      ['3 & 1 + 2', 3],
    ].forEach(([expression, value]) => {
      expect(rpn(<string>expression)).toBe(value);
    });
  });

  it('calculates keyword expressions', () => {
    const KEYWORDS = {
      test: -2.2,
      test2: -3,
    };

    [
      ['2+test+(-test*2)+test2', 2 + -2.2 + -(-2.2) * 2 - 3],
      ["2+'ab c'", 0x63206263],
    ].forEach(([expression, value]) => {
      expect(
        rpn(<string>expression, {
          keywordResolver: R.prop(R.__, KEYWORDS),
        }),
      ).toBe(value);
    });
  });
});

describe('error handling', () => {
  it('handles div by zero', () => {
    expect.assertions(1);

    try {
      rpn('2/(2-2)');
    } catch (e) {
      expect(e.code).toBe(MathErrorCode.DIVISION_BY_ZERO);
    }
  });

  it('handles unknown keyword', () => {
    expect.assertions(1);

    try {
      rpn('2/(2-4)+test');
    } catch (e) {
      expect(e.code).toBe(MathErrorCode.UNKNOWN_KEYWORD);
    }
  });
});
