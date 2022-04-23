import {CTypeCheckErrorCode} from './utils/analyzeMatcher';

describe('Type casting', () => {
  test('implicit integral type to pointer casts', () => {
    expect(/* cpp */ `const char* a = 'a';`).not.toHaveCompilerError();
    expect(/* cpp */ `const int* a = 'a';`).not.toHaveCompilerError();
    expect(/* cpp */ `const int* a = 5;`).not.toHaveCompilerError();
  });

  test('implicit floating type to pointer casts throws error', () => {
    expect(/* cpp */ `const char* a = 2.5;`).toHaveCompilerError(
      CTypeCheckErrorCode.INCORRECT_INITIALIZED_VARIABLE_TYPE,
    );

    expect(/* cpp */ `const char* a = 2.5f;`).toHaveCompilerError(
      CTypeCheckErrorCode.INCORRECT_INITIALIZED_VARIABLE_TYPE,
    );
  });

  test('force cast float number to integral and assign to ptr', () => {
    expect(/* cpp */ `const char* a = (int) 2.5;`).not.toHaveCompilerError(
      CTypeCheckErrorCode.INCORRECT_INITIALIZED_VARIABLE_TYPE,
    );
  });
});
