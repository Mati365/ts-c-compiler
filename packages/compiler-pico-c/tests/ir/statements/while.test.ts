import '../utils/irMatcher';

describe('While stmt', () => {
  test('basic while statement', () => {
    expect(/* cpp */ `
      void main() {
        while(2 > 1) {
          int a;
        }
      }
    `).toCompiledIRBeEqual(/* ruby */`
      # --- Block main ---
      def main():
        L1:
        %t{0}: int2B = %2: int2B greater_than %1: int2B
        if: %t{0}: int2B equal %0: int2B then L2
        a{0}: int*2B = alloca int2B
        jmp L1:
        L2:
        ret
        end-def
    `);
  });

  test('do while', () => {
    expect(/* cpp */ `
      void main() {
        do {
          int a;
        } while (2 > 1);
      }
    `).toCompiledIRBeEqual(/* ruby */`
      # --- Block main ---
      def main():
        L1:
        a{0}: int*2B = alloca int2B
        %t{0}: int2B = %2: int2B greater_than %1: int2B
        if: %t{0}: int2B differs %0: int2B then L1
        ret
        end-def
    `);
  });
});
