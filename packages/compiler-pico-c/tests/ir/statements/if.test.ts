import '../utils/irMatcher';

describe('If stmt', () => {
  test('basic if statement', () => {
    expect(/* cpp */ `
      void main() {
        if (2) {
          int a;
        }
      }
    `).toCompiledIRBeEqual(/* ruby */ `
      # --- Block main ---
      def main():
      %t{0}: i1:zf = icmp %2: int2B differs %0: int2B
      br %t{0}: i1:zf, false: L1
      L2:
      a{0}: int*2B = alloca int2B
      L1:
      ret
      end-def
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
    `).toCompiledIRBeEqual(/* ruby */ `
      # --- Block main ---
      def main():
        a{0}: int*2B = alloca int2B
        *(a{0}: int*2B) = store %2: int2B
        b{0}: int*2B = alloca int2B
        *(b{0}: int*2B) = store %4: int2B
        %t{0}: int2B = load a{0}: int*2B
        %t{1}: i1:zf = icmp %t{0}: int2B greater_than %2: int2B
        br %t{1}: i1:zf, false: L3
        L4:
        %t{2}: int2B = load a{0}: int*2B
        %t{3}: int2B = load b{0}: int*2B
        %t{4}: i1:zf = icmp %t{2}: int2B greater_than %t{3}: int2B
        br %t{4}: i1:zf, true: L2
        L3:
        %t{5}: int2B = load b{0}: int*2B
        %t{6}: i1:zf = icmp %t{5}: int2B greater_than %1: int2B
        br %t{6}: i1:zf, true: L2
        jmp L1
        L2:
        %1_a{0}: int*2B = alloca int2B
        L1:
        ret
        end-def
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
    `).toCompiledIRBeEqual(/* ruby */ `
      # --- Block main ---
      def main():
        a{0}: int*2B = alloca int2B
        *(a{0}: int*2B) = store %2: int2B
        b{0}: int*2B = alloca int2B
        *(b{0}: int*2B) = store %4: int2B
        %t{0}: int2B = load a{0}: int*2B
        %t{1}: i1:zf = icmp %t{0}: int2B greater_than %2: int2B
        br %t{1}: i1:zf, false: L3
        L2:
        %1_a{0}: int*2B = alloca int2B
        jmp L4
        L3:
        %t{2}: int2B = load b{0}: int*2B
        %t{3}: i1:zf = icmp %t{2}: int2B greater_than %2: int2B
        br %t{3}: i1:zf, false: L6
        L5:
        %1_b{0}: int*2B = alloca int2B
        jmp L4
        L6:
        c{0}: int*2B = alloca int2B
        L4:
        ret
        end-def
    `);
  });
});
