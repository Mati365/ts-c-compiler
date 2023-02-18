import { GrammarErrorCode } from '@compiler/grammar/GrammarError';
import { CTypeCheckErrorCode } from './utils';

describe('Function typecheck', () => {
  test('semicolon at end of function is optional', () => {
    expect(/* cpp */ `
      void main() {};
      void main2() {}
    `).not.toHaveCompilerError();
  });

  test('calling function without args', () => {
    expect(/* cpp */ `
      void sum() {}
      void test() {
        sum();
      }
    `).not.toHaveCompilerError();
  });

  test('returning int in int return type', () => {
    expect(/* cpp */ `int sum() { return 2; }`).not.toHaveCompilerError();
  });

  test('returning struct in void return type raises error', () => {
    expect(/* cpp */ `
      void sum() {
        struct Vec2 { int x, y; } vec;
        return vec;
      }
    `).toHaveCompilerError(CTypeCheckErrorCode.RETURN_EXPRESSION_WRONG_TYPE);
  });

  test('returning inline struct in int return type raises error', () => {
    expect(/* cpp */ `
      int sum() {
        return struct Vec2 { int x, y; } vec = { .x = 5, 6 };
      }
  `).toHaveCompilerError(GrammarErrorCode.SYNTAX_ERROR);
  });

  test('redefinition fn error if there is already defined fn with the same name', () => {
    expect(/* cpp */ `
      void sum(int a) {}
      void sum() {}
    `).toHaveCompilerError(CTypeCheckErrorCode.REDEFINITION_OF_TYPE);
  });

  test('redefinition variable error if arg name has already name of local fn variable', () => {
    expect(/* cpp */ `void sum(int a) { int a; }`).toHaveCompilerError(
      CTypeCheckErrorCode.REDEFINITION_OF_VARIABLE,
    );
  });

  test('calling function without args raises error', () => {
    expect(/* cpp */ `
      void sum(int x, int y) {}
      void main() { sum(); }
    `).toHaveCompilerError(
      CTypeCheckErrorCode.WRONG_ARGS_COUNT_PASSED_TO_FUNCTION,
    );
  });

  test('calling function with too many args raises error', () => {
    expect(/* cpp */ `
      void sum(int x, int y) {}
      void main() {
        sum(2, 3, 4);
      }
    `).toHaveCompilerError(
      CTypeCheckErrorCode.TOO_MANY_ARGS_PASSED_TO_FUNCTION,
    );
  });

  test('calling function with corrects args count does not raise error', () => {
    expect(/* cpp */ `
      void sum(int x, int y) {}
      void main() {
        sum(2, 3);
      }
    `).not.toHaveCompilerError();
  });

  test('returning constant expression in function does not raise error', () => {
    expect(
      /* cpp */ `int main() { return 2 + 3 + 4 / (4 * 4); }`,
    ).not.toHaveCompilerError();
  });

  test('returning pointer expression in function does not raise error', () => {
    expect(
      /* cpp */ `int* ptr() { int a = 2; return &a; }`,
    ).not.toHaveCompilerError();
  });

  test.skip('returning struct type', () => {
    expect(/* cpp */ `
      struct Vec2 {
        int x, y;
      };

      struct Vec2 main() {
        struct Vec2 a = { .x = 5 };
        return a;
      }
    `).not.toHaveCompilerError();
  });

  test('double const specifier raises error', () => {
    expect(
      /* cpp */ `const const int sum() { return 2; }`,
    ).toHaveCompilerError();
  });

  test('const specifier does not raise error', () => {
    expect(/* cpp */ `const int sum() { return 2; }`).not.toHaveCompilerError();
  });

  test('calling empty function with too many args does not raise error', () => {
    expect(/* cpp */ `
      int sum() {};
      int main() {
        sum(1, 2, 3);
      }
    `).not.toHaveCompilerError();
  });

  test('calling function with void args without args', () => {
    expect(/* cpp */ `
      int sum(void) {};
      int main() { sum(); }
    `).not.toHaveCompilerError();
  });

  test('calling function with void args without args', () => {
    expect(/* cpp */ `
      int sum(void) {};
      int main() { sum(1, 2, 3); }
    `).toHaveCompilerError(
      CTypeCheckErrorCode.TOO_MANY_ARGS_PASSED_TO_FUNCTION,
    );
  });

  test('can return value from void and does not crash', () => {
    expect(/* cpp */ `
      void sum(int a, int b) {
        int k = a + b;
        return k;
      }
    `).not.toHaveCompilerError();
  });

  test.skip('assign function return to variable does not throw error', () => {
    expect(/* cpp */ `
      int sum(void) { return 2; }
      int main() { int acc = sum(); }
    `).toHaveCompilerError();
  });
});
