import '../utils/irMatcher';

describe('Constants IR', () => {
  test('enum variables are optimized', () => {
    expect(/* cpp */ `
      enum {
        ONE = 1,
        TWO = 2,
      };

      int sum() {
        return ONE + TWO;
      }
    `).toCompiledIRBeEqual(/* ruby */ `
      # --- Block sum ---
      def sum(): [ret: int2B]
        ret %3: int2B
        end-def
    `);
  });
});
