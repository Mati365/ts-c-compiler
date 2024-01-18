import { CTypeCheckErrorCode } from './utils';

const BIT_OPERATORS = ['<<', '>>', '^', '|', '&'];

describe('Float typechecks', () => {
  test.each(BIT_OPERATORS)(
    'non math %s operator not work with floats in math expression',
    operator => {
      expect(/* cpp */ `
      int main() {
        float b = 4;
        float a = b ${operator} 3;
      }
    `).toHaveCompilerError(
        CTypeCheckErrorCode.MATH_EXPRESSION_MUST_BE_INTEGRAL_TYPE,
      );
    },
  );

  test.each(BIT_OPERATORS)(
    'non math %s operator not work with floats in math assign expression',
    operator => {
      expect(/* cpp */ `
      int main() {
        float b = 4;
        float a = 4;

        a ${operator}= 3;
      }
    `).toHaveCompilerError(
        CTypeCheckErrorCode.MATH_EXPRESSION_MUST_BE_INTEGRAL_TYPE,
      );
    },
  );
});
