import '../utils/irMatcher';

describe('If stmt', () => {
  test('basic if statement', () => {
    expect(/* cpp */ `
      void main() {
        if (2) {
          int a;
        }
      }
    `).toCompiledIRBeEqual(/* ruby */`
      # --- Block main ---
      def main():
        if: %2: int2B equal %0: int2B then L1
        a{0}: int*2B = alloca int2B
        L1:
        ret
    `);
  });

  test('basic if statement with mixed && and ||', () => {
    expect(/* cpp */ `
      void main() {
        int a = 2, b = 4;

        if (a > 2 && a > b || b > 1) {
          int a;
        }
      }
    `).toCompiledIRBeEqual(/* ruby */`
      # --- Block main ---
      def main():
        a{0}: int*2B = alloca int2B
        *(a{0}: int*2B) = store %2: int2B
        b{0}: int*2B = alloca int2B
        *(b{0}: int*2B) = store %4: int2B
        %t{0}: int2B = load a{0}: int*2B
        %t{1}: int2B = %t{0}: int2B greater_than %2: int2B
        if: %t{1}: int2B equal %0: int2B then L1
        %t{2}: int2B = load a{0}: int*2B
        %t{3}: int2B = load b{0}: int*2B
        %t{4}: int2B = %t{2}: int2B greater_than %t{3}: int2B
        L1:
        if: %t{4}: int2B differs %0: int2B then L2
        %t{5}: int2B = load b{0}: int*2B
        %t{6}: int2B = %t{5}: int2B greater_than %1: int2B
        L2:
        %t{7}: int2B = φ(%t{4}: int2B, %t{6}: int2B)
        if: %t{7}: int2B equal %0: int2B then L3
        %1_a{0}: int*2B = alloca int2B
        L3:
        ret
    `);
  });

  test('basic if else statement', () => {
    expect(/* cpp */ `
      void main() {
        int a = 2, b = 4;

        if (a > 2) {
          int a;
        } else if (b > 2) {
          int b;
        } else {
          int c;
        }
      }
    `).toCompiledIRBeEqual(/* ruby */`
      # --- Block main ---
      def main():
        a{0}: int*2B = alloca int2B
        *(a{0}: int*2B) = store %2: int2B
        b{0}: int*2B = alloca int2B
        *(b{0}: int*2B) = store %4: int2B
        %t{0}: int2B = load a{0}: int*2B
        %t{1}: int2B = %t{0}: int2B greater_than %2: int2B
        if: %t{1}: int2B equal %0: int2B then L1
        %1_a{0}: int*2B = alloca int2B
        jmp L4:
        L1:
        %t{2}: int2B = load b{0}: int*2B
        %t{3}: int2B = %t{2}: int2B greater_than %2: int2B
        if: %t{3}: int2B equal %0: int2B then L3
        %1_b{0}: int*2B = alloca int2B
        jmp L4:
        L3:
        c{0}: int*2B = alloca int2B
        L4:
        ret
    `);
  });
});
