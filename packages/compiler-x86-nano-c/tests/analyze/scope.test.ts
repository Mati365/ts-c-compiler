import {CTypeCheckErrorCode} from './utils/analyzeMatcher';

describe('Variables scope', () => {
  test('accessing variable defined in "if" outside of it raises error', () => {
    expect(/* cpp */ `
      int main() {
        if (2 + 4 > 10) {
          int d = 5;
        }

        int a = d + 5;
      }
    `).toHaveCompilerError(CTypeCheckErrorCode.UNKNOWN_IDENTIFIER);
  });

  test('accessing variable defined in "else" outside of it raises error', () => {
    expect(/* cpp */ `
      int main() {
        if (2 + 4 > 10) {
          int c = 7;
        } else {
          int c = 6;
        }

        int a = 5 + c;
      }
    `).toHaveCompilerError(CTypeCheckErrorCode.UNKNOWN_IDENTIFIER);
  });
});
