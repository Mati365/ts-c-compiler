import '../utils';

describe('While stmt', () => {
  test('basic while statement', () => {
    expect(/* cpp */ `
      void main() {
        while(2 > 1) {
          int a;
        }
      }
    `).toCompiledIRBeEqual(/* ruby */ `
      # --- Block main ---
      def main():
        L1:
        %t{0}: i1:zf = icmp %2: char1B greater_than %1: char1B
        br %t{0}: i1:zf, false: L2
        a{0}: int*2B = alloca int2B
        jmp L1
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
    `).toCompiledIRBeEqual(/* ruby */ `
      # --- Block main ---
      def main():
        L1:
        a{0}: int*2B = alloca int2B
        %t{0}: i1:zf = icmp %2: char1B greater_than %1: char1B
        br %t{0}: i1:zf, true: L1
        ret
        end-def
    `);
  });
});
