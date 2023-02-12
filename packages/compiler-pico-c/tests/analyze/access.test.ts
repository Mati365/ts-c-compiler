import { CTypeCheckErrorCode } from './utils';

describe('Variable access', () => {
  test('access first level depth nested structure fails if assign to int', () => {
    expect(/* cpp */ `
        struct Vec2 {
          int x, y;
          struct Rect { int z; } nested;
        } abc = { .x = 5 };

        int acc = abc.nested + 4;
    `).toHaveCompilerError(CTypeCheckErrorCode.OPERATOR_SIDES_TYPES_MISMATCH);
  });

  test('access nested array struct item to int', () => {
    expect(/* cpp */ `
        struct Vec2 {
          int x, y;
          struct Rect { int z; } nested[2];
        } abc = { .x = 5 };

        int acc = abc.nested[0].z + 4;
    `).not.toHaveCompilerError();
  });

  test('array like access to array variables', () => {
    expect(/* cpp */ `
        int numbers[] = { 1, 2, 3 };
        int item = numbers[1];
    `).not.toHaveCompilerError();
  });

  test('assign to array const item raises error', () => {
    expect(/* cpp */ `
      void main() {
        const int arr[] = { 1, 2, 3, 4 };
        arr[1] = 4;
      }
    `).toHaveCompilerError(CTypeCheckErrorCode.ASSIGNMENT_TO_CONST);
  });

  test('array like access to int number fails', () => {
    expect(/* cpp */ `
        int str = 2;
        char item = str[1];
    `).toHaveCompilerError(CTypeCheckErrorCode.WRONG_NON_ARRAY_FIELD_ACCESS);
  });

  test('struct like access to int number fails', () => {
    expect(/* cpp */ `
        int str = 2;
        char item = str.abc;
    `).toHaveCompilerError(CTypeCheckErrorCode.WRONG_NON_STRUCT_FIELD_ACCESS);
  });

  test('array like access to pointer variables', () => {
    expect(/* cpp */ `
        const char* str = "Hello world";
        char item = str[1];
    `).not.toHaveCompilerError();
  });
});
