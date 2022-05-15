import {CTypeCheckErrorCode} from './utils/analyzeMatcher';

describe('Variables scope', () => {
  test('redefine of scope variable trigger error', () => {
    expect(/* cpp */ `
      int main() {
        int c = 1;
        int c = 2;
      }
    `).toHaveCompilerError(CTypeCheckErrorCode.REDEFINITION_OF_VARIABLE);
  });

  describe('for statement', () => {
    test('accessing index variable defined in "for" outside of it raises error', () => {
      expect(/* cpp */ `
        int main() {
          for (int i = 0; i < 10; ++i) {}

          int a = i + 5;
        }
      `).toHaveCompilerError(CTypeCheckErrorCode.UNKNOWN_IDENTIFIER);
    });


    test('accessing index variable defined in "for" works fine', () => {
      expect(/* cpp */ `
        int main() {
          for (int i = 0; i < 10; ++i) {
            int a = i + 5;
          }
        }
      `).not.toHaveCompilerError();
    });

    test('redefinition error in "for" works fine', () => {
      expect(/* cpp */ `
        int main() {
          for (int i = 0; i < 10; ++i) {
            int i = 5;
          }
        }
      `).toHaveCompilerError(CTypeCheckErrorCode.REDEFINITION_OF_VARIABLE);
    });

    test('accessing variable defined in "for" body outside of it raises error', () => {
      expect(/* cpp */ `
        int main() {
          for (int i = 0; i < 10; ++i) {
            int d = 5;
          }

          int a = d + 5;
        }
      `).toHaveCompilerError(CTypeCheckErrorCode.UNKNOWN_IDENTIFIER);
    });
  });

  describe('if statement', () => {
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
  });

  describe('while statement', () => {
    test('accessing variable defined in "while" body outside of it raises error', () => {
      expect(/* cpp */ `
        int main() {
          while(2 > 3) {
            int a = 7;
          }

          a = 5;
        }
      `).toHaveCompilerError(CTypeCheckErrorCode.UNKNOWN_IDENTIFIER);
    });
  });

  describe('do while statement', () => {
    test('accessing variable defined in "do while" body outside of it raises error', () => {
      expect(/* cpp */ `
        int main() {
          do {
            int a = 7;
          } while(2 > 3);

          a = 5;
        }
      `).toHaveCompilerError(CTypeCheckErrorCode.UNKNOWN_IDENTIFIER);
    });
  });
});
