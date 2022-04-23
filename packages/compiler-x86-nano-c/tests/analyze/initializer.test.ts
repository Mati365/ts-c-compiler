import {CTypeCheckErrorCode} from './utils/analyzeMatcher';

describe('Initializer typecheck', () => {
  test('initializer list to auto flatten array size', () => {
    expect(/* cpp */ `int array[] = { 2, 3 };`).not.toHaveCompilerError();
  });

  test('initializer list to auto multidimensional array size', () => {
    expect(
      /* cpp */ `int array[][] = { 2, 3, { 3, 4 } };`,
    ).toHaveCompilerError(CTypeCheckErrorCode.INCOMPLETE_ARRAY_SIZE);
  });

  test('excess array in const char* array literal initializer', () => {
    expect(/* cpp */ `const char* dupa = { "XD", "XDD" };`).toHaveCompilerError();
  });

  test('literal string multidimensional array', () => {
    expect(/* cpp */ `char abc[][4] = { "abcg", "defg" };`).not.toHaveCompilerError();
    expect(/* cpp */ `char abc[][4] = { "abcgg", "defg" };`).toHaveCompilerError();
  });

  test('literal pointers array', () => {
    expect(/* cpp */ `char* abc[] = {"ABC", "DEF"};`).not.toHaveCompilerError();
    expect(/* cpp */ `char* abc = "ABC";`).not.toHaveCompilerError();
  });

  test('literal pointers mixed with int scalars array', () => {
    expect(/* cpp */ `char* abc[] = {"ABC", "DEF", { 1, 2, 3 }};`)
      .toHaveCompilerError(CTypeCheckErrorCode.EXCESS_ELEMENTS_IN_ARRAY_INITIALIZER);
  });

  test('literal pointers mixed with int scalars array', () => {
    expect(/* cpp */ `char* abc[] = {"ABC", "DEF", { 1 }};`).not.toHaveCompilerError();
  });

  test('unable to assign initializer to scalar', () => {
    expect(/* cpp */ `int number = "ABC";`)
      .toHaveCompilerError(CTypeCheckErrorCode.INCORRECT_INITIALIZED_VARIABLE_TYPE);
  });

  test('trailing commas are allowed in initializer', () => {
    expect(/* cpp */ `int array[3] = { 2, 3, };`).not.toHaveCompilerError();
    expect(/* cpp */ `int array[3][4] = { 2, 3, { 2 }, };`).not.toHaveCompilerError();
  });

  test('allow to pass blank list of initializer list to array', () => {
    expect(/* cpp */ `int array[3] = {};`).not.toHaveCompilerError();
  });

  test('allow to pass flatten list to multidimensional array', () => {
    expect(/* cpp */ `int array[2][3] = { 2, 3, 4 };`).not.toHaveCompilerError();
  });

  test('allow to pass nested list for flatten array', () => {
    expect(
      /* cpp */ `int array[4] = { { 2 }, { 3 }, { 4 }, { 5 } };`,
    ).not.toHaveCompilerError();
  });

  test('detects excess in passed initializer list', () => {
    expect(
      /* cpp */ `int array[2][2] = { 2, 3, 4, 5, 6 };`,
    ).toHaveCompilerError(CTypeCheckErrorCode.EXCESS_ELEMENTS_IN_ARRAY_INITIALIZER);
  });

  test('detects excess in passed nested list in scalar type', () => {
    expect(
      /* cpp */ `int array[4] = { { 2, 5 }, { 3 }, { 4 }, { 5 } };`,
    ).toHaveCompilerError(CTypeCheckErrorCode.EXCESS_ELEMENTS_IN_SCALAR_INITIALIZER);
  });

  test('throws error if used scalar initializer to array like type', () => {
    expect(
      /* cpp */ `int array[4] = 1;`,
    ).toHaveCompilerError(CTypeCheckErrorCode.INVALID_INITIALIZER);
  });

  test('allow to use array initializer to scalar value', () => {
    expect(
      /* cpp */ `int array = { 1 };`,
    ).not.toHaveCompilerError();
  });

  test('incomplete definition of three dimensional array with nested initializer', () => {
    expect(
      /* cpp */ `
      short q[4][3][2] = {
        { 1 },
        { 2, 3 },
        { 4, 5, 6 }
      };
      `,
    ).not.toHaveCompilerError();
  });

  test('flatten incomplete definition of three dimensional array', () => {
    expect(
      /* cpp */ `
        short q[4][3][2] = {
          1, 0, 0, 0, 0, 0,
          2, 3, 0, 0, 0, 0,
          4, 5, 6
        };
      `,
    ).not.toHaveCompilerError();
  });

  test('string array initialization', () => {
    expect(/* cpp */ `char abc[] = "ASSS";`).not.toHaveCompilerError();
  });

  test('throws error on string literal in char array', () => {
    expect(/* cpp */ `char abc3[] = { 'A', 'B', "SSSSS" };`).toHaveCompilerError();
  });

  test('string const char* initialization', () => {
    expect(
      /* cpp */ `
        const char* abc = "Hello world!";
        char* abc2 = "Hello!";
      `,
    ).not.toHaveCompilerError();
  });

  test('letters char array initialization', () => {
    expect(/* cpp */ `char s[] = { 'a', 'b', 'c', '\0' };`).not.toHaveCompilerError();
  });

  test('flatten array with designation', () => {
    expect(
      /* cpp */ `
        int a[] = {
          1, 3, 5, 7, 9, [8] = 8, 6, 4, 2, 0
        };
      `,
    ).not.toHaveCompilerError();
  });

  test('single struct with wrong designation initialization', () => {
    expect(
      /* cpp */ `struct Vec2 { int x, y; } screen = { .x = 5, .y = 5.0 };`,
    ).not.toHaveCompilerError(CTypeCheckErrorCode.INCORRECT_CONSTANT_EXPR_IDENTIFIER);
  });

  test('single struct designation initialization', () => {
    expect(
      /* cpp */ `struct Vec2 { int x, y; } screen = { .x = 5, .y = 5 };`,
    ).not.toHaveCompilerError();
  });

  test('anonymous struct non-designated array initializer', () => {
    expect(/* cpp */ `struct { int a[3], b; } w[] = { { 1 }, 2 };`).not.toHaveCompilerError();
  });

  test('offset array designation initializer', () => {
    expect(/* cpp */ `int foo[10] = { [8] = 1 };`).not.toHaveCompilerError();
  });

  test('offset array designation initializer in struct type throws error', () => {
    expect(/* cpp */ `struct { int x, y; } foo = { [8] = 1 };`).toHaveCompilerError(
      CTypeCheckErrorCode.INCORRECT_INDEX_INITIALIZER_USAGE,
    );
  });

  test('named designation initializer in array type throws error', () => {
    expect(/* cpp */ `int[] foo = { .x = 1 };`).toHaveCompilerError(
      CTypeCheckErrorCode.INCORRECT_NAMED_STRUCTURE_INITIALIZER_USAGE,
    );
  });

  test('single dimensional array index designation overflow', () => {
    expect(/* cpp */ `int foo[4] = { [8] = 1 };`).toHaveCompilerError(
      CTypeCheckErrorCode.INDEX_INITIALIZER_ARRAY_OVERFLOW,
    );
  });

  test('multi dimensional array index designation overflow', () => {
    expect(/* cpp */ `int foo[4][5] = { [2][3] = 1 };`).not.toHaveCompilerError();
    expect(/* cpp */ `int foo[4][5] = { [2][4] = 1 };`).not.toHaveCompilerError();

    expect(/* cpp */ `int foo[4][5] = { [2][6] = 1 };`).toHaveCompilerError(
      CTypeCheckErrorCode.INDEX_INITIALIZER_ARRAY_OVERFLOW,
    );
    expect(/* cpp */ `int foo[4][5] = { [2][5] = 1 };`).toHaveCompilerError(
      CTypeCheckErrorCode.INDEX_INITIALIZER_ARRAY_OVERFLOW,
    );
    expect(/* cpp */ `int foo[4][5] = { [4][4] = 1 };`).toHaveCompilerError(
      CTypeCheckErrorCode.INDEX_INITIALIZER_ARRAY_OVERFLOW,
    );
  });

  test('single dimensional array with nested index initializer overflow', () => {
    expect(
      /* cpp */ `
        struct { int a[3], b; } w[] = {
          [1].a[0] = 2,
          [1].a[1] = 3,
          [3].a[4] = 4,
        };
      `,
    ).toHaveCompilerError(CTypeCheckErrorCode.INDEX_INITIALIZER_ARRAY_OVERFLOW);
  });

  test('unknown named structure field initializer', () => {
    expect(/* cpp */`struct { int z, x; } a = { .test = 2 };`).toHaveCompilerError(
      CTypeCheckErrorCode.UNKNOWN_NAMED_STRUCTURE_INITIALIZER,
    );
  });

  test('designation with anonymous enum', () => {
    expect(
      `
        enum { member_one, member_two, member_three };
        const char *nm[] = {
          [member_two] = "member two",
          [member_one] = "member one",
          [member_three] = "member one",
        };
      `,
    ).not.toHaveCompilerError();
  });

  test('struct with designation nested items', () => {
    expect(
      /* cpp */ `
        struct { int a[3], b; } w[] = {
          [0].a = {1},
          [1].a[0] = 2
        };
      `,
    ).not.toHaveCompilerError();
  });

  test('advanced nested initializers', () => {
    expect(
      /* cpp */ `
        struct {
          int x[5];
          struct {
            int y, x;

            struct {
              int maslo, ser;
            } chleb;
          } part;
          int z;
        } vec = {
          1, 2, 3,
          .part = {
            .y = 6,
            .chleb = { 1, 2 }
          },
          .z = 7,
        };
      `,
    ).not.toHaveCompilerError();
  });

  test('dynamic variable initializer', () => {
    expect(
      /* cpp */ `
        int d = 5;
        int acc = d + 4;
      `,
    ).not.toHaveCompilerError();
  });

  test('dynamic missing variable initializer', () => {
    expect(/* cpp */ `int acc = d + 4;`).toHaveCompilerError(CTypeCheckErrorCode.UNKNOWN_IDENTIFIER);
  });

  test('dynamic initializer typecheck fails if try to assign structure to int', () => {
    expect(
      /* cpp */ `
        struct Vec2 { int x, y; } abc = { .x = 5 };
        int acc = abc + 4;
      `,
    ).toHaveCompilerError(CTypeCheckErrorCode.OPERATOR_SIDES_TYPES_MISMATCH);
  });
});
