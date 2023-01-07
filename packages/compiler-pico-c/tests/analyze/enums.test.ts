import './utils/analyzeMatcher';

describe('Enum typecheck', () => {
  test('anonymous enums have resolveable entries in current scope', () => {
    expect(/* cpp */ `
        enum {
          ONE = 1,
          TWO = 2,
        };

        int sum() {
          return ONE + TWO;
        }
      `).not.toHaveCompilerError();
  });
});
