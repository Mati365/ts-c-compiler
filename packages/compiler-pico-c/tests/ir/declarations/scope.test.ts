import '../utils';

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
    `).toCompiledIRBeEqual(/* ruby */ `
      # --- Block main ---
      def main():
        x{0}: int*2B = alloca int2B
        *(x{0}: int*2B) = store %2: int2B
        %t{0}: int2B = load x{0}: int*2B
        %t{1}: int2B = %t{0}: int2B plus %1: int2B
        *(x{0}: int*2B) = store %t{1}: int2B
        %t{2}: i1:zf = icmp %1: char1B differs %0: int2B
        br %t{2}: i1:zf, false: L1
        L2:
        %1_x{0}: int**2B = alloca int*2B
        %t{3}: int2B = load x{0}: int*2B
        %t{4}: int2B = load %t{3}: int2B
        *(%1_x{0}: int**2B) = store %t{4}: int2B
        d{0}: int*2B = alloca int2B
        %t{5}: int*2B = load %1_x{0}: int**2B
        %t{6}: int2B = load %t{5}: int*2B
        %t{7}: int2B = %t{6}: int2B plus %5: char1B
        *(d{0}: int*2B) = store %t{7}: int2B
        L1:
        ret
        end-def
    `);
  });
});
