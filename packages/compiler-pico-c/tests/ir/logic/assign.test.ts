import '../utils/irMatcher';

describe('Logic assign', () => {
  test('assign with OR', () => {
    expect(/* cpp */ `
      void main() {
        int a = 2;
        int b = a > 0 || a*2 > 0;
      }
    `).toCompiledIRBeEqual(/* ruby */`
      # --- Block L1 ---
      def main():
        a{0}: int*2B = alloca int2B
        *(a{0}: int*2B) = store %2: int2B
        b{0}: int*2B = alloca int2B
        %t{0}: int2B = load a{0}: int*2B
        %t{1}: int2B = %t{0}: int2B greater_than %0: int2B
        if: %t{1}: int2B differs %0: int2B then L1
        %t{2}: int2B = load a{0}: int*2B
        %t{3}: int2B = %t{2}: int2B mul %2: int2B
        %t{4}: int2B = %t{3}: int2B greater_than %0: int2B
        L1:
        %t{5}: int2B = φ(%t{1}: int2B, %t{4}: int2B)
        *(b{0}: int*2B) = store %t{5}: int2B
        ret
    `);
  });

  test('assign with OR', () => {
    expect(/* cpp */ `
      void main() {
        int a = 2;
        int b = a > 0 && a*2 > 0;
      }
    `).toCompiledIRBeEqual(/* ruby */`
      # --- Block L1 ---
      def main():
        a{0}: int*2B = alloca int2B
        *(a{0}: int*2B) = store %2: int2B
        b{0}: int*2B = alloca int2B
        %t{0}: int2B = load a{0}: int*2B
        %t{1}: int2B = %t{0}: int2B greater_than %0: int2B
        if: %t{1}: int2B equal %0: int2B then L1
        %t{2}: int2B = load a{0}: int*2B
        %t{3}: int2B = %t{2}: int2B mul %2: int2B
        %t{4}: int2B = %t{3}: int2B greater_than %0: int2B
        L1:
        *(b{0}: int*2B) = store %t{4}: int2B
        ret
    `);
  });

  test('assign with mixed logic expression', () => {
    expect(/* cpp */ `
      void main() {
        int a = 2;
        int b = a > 0 && (a > 3 || a > 4);
      }
    `).toCompiledIRBeEqual(/* ruby */`
      # --- Block L2 ---
      def main():
        a{0}: int*2B = alloca int2B
        *(a{0}: int*2B) = store %2: int2B
        b{0}: int*2B = alloca int2B
        %t{0}: int2B = load a{0}: int*2B
        %t{1}: int2B = %t{0}: int2B greater_than %0: int2B
        if: %t{1}: int2B equal %0: int2B then L2
        %t{2}: int2B = load a{0}: int*2B
        %t{3}: int2B = %t{2}: int2B greater_than %3: int2B
        if: %t{3}: int2B differs %0: int2B then L1
        %t{4}: int2B = load a{0}: int*2B
        %t{5}: int2B = %t{4}: int2B greater_than %4: int2B
        L1:
        %t{6}: int2B = φ(%t{3}: int2B, %t{5}: int2B)
        L2:
        *(b{0}: int*2B) = store %t{6}: int2B
        ret
    `);
  });
});
