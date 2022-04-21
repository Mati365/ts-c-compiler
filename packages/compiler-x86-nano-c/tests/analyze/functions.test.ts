import {GrammarErrorCode} from '@compiler/grammar/GrammarError';
import {CTypeCheckErrorCode} from './utils/analyzeMatcher';

describe('Function typecheck', () => {
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
    expect(/* cpp */ `void sum(int a) { int a; }`).toHaveCompilerError(CTypeCheckErrorCode.REDEFINITION_OF_VARIABLE);
  });

  test('calling function without args raises error', () => {
    expect(/* cpp */ `
      void sum(int x, int y) {}
      void main() { sum(); }
    `).toHaveCompilerError(CTypeCheckErrorCode.WRONG_ARGS_COUNT_PASSED_TO_FUNCTION);
  });

  test('calling function with too many args raises error', () => {
    expect(/* cpp */ `
      void sum(int x, int y) {}
      void main() {
        sum(2, 3, 4);
      }
    `).toHaveCompilerError(CTypeCheckErrorCode.WRONG_ARGS_COUNT_PASSED_TO_FUNCTION);
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
    expect(/* cpp */ `int main() { return 2 + 3 + 4 / (4 * 4); }`).not.toHaveCompilerError();
  });

  test('returning pointer expression in function does not raise error', () => {
    expect(/* cpp */ `int* ptr() { int a = 2; return &a; }`).not.toHaveCompilerError();
  });
});
