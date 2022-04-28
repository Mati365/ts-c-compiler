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

  test('redefine of nested scope variable does not trigger error', () => {
    expect(/* cpp */ `
      int main() {
        int c = 1;

        if (11 > 10) {
          int c = 7;
        } else {
          int c = 6;
        }
      }
    `).not.toHaveCompilerError();
  });

  test('redefine of scope variable trigger error', () => {
    expect(/* cpp */ `
      int main() {
        int c = 1;
        int c = 2;
      }
    `).toHaveCompilerError(CTypeCheckErrorCode.REDEFINITION_OF_VARIABLE);
  });
});
