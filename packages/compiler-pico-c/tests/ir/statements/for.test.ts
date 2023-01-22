import '../utils/irMatcher';

describe('For stmt', () => {
  test('for statement', () => {
    expect(/* cpp */ `
      void main() {
        for (int i = 0; i < 10; ++i) {
          int a = 3;
        }
      }
    `).toCompiledIRBeEqual(/* ruby */ `
      # --- Block main ---
      def main():
        i{0}: int*2B = alloca int2B
        *(i{0}: int*2B) = store %0: int2B
        L1:
        %t{0}: int2B = load i{0}: int*2B
        %t{1}: i1:zf = icmp %t{0}: int2B less_than %10: int2B
        br %t{1}: i1:zf, true: L2, false: L3
        L2:
        a{0}: int*2B = alloca int2B
        *(a{0}: int*2B) = store %3: int2B
        %t{2}: int2B = load i{0}: int*2B
        %t{3}: int2B = %t{2}: int2B plus %1: int2B
        *(i{0}: int*2B) = store %t{3}: int2B
        jmp L1
        L3:
        ret
        end-def
    `);
  });
});
