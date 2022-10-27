import '../utils/irMatcher';

describe('Declaration scope', () => {
  test('should be possible to shadow variable name', () => {
    expect(/* cpp */ `
      void main() {
        int x = 2;
        x++;
        if (1) {
          int *x = *x;
          int d = *x + 5;
        }
      }
    `).toCompiledIRBeEqual(/* ruby */`
      # --- Block main ---
      def main():
        x{0}: int*2B = alloca int2B
        *(x{0}: int*2B) = store %2: int2B
        %t{0}: int2B = load x{0}: int*2B
        %t{1}: int2B = %t{0}: int2B plus %1: int2B
        *(x{0}: int*2B) = store %t{1}: int2B
        if: %1: int2B equal %0: int2B then L1
        %1_x{0}: int**2B = alloca int*2B
        %t{2}: int2B = load x{0}: int*2B
        %t{3}: int2B = load %t{2}: int2B
        *(%1_x{0}: int**2B) = store %t{3}: int2B
        d{0}: int*2B = alloca int2B
        %t{4}: int*2B = load %1_x{0}: int**2B
        %t{5}: int2B = load %t{4}: int*2B
        %t{6}: int2B = %t{5}: int2B plus %5: int2B
        *(d{0}: int*2B) = store %t{6}: int2B
        L1:
        ret
        end-def
    `);
  });
});
