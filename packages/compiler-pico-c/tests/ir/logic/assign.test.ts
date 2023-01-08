import '../utils/irMatcher';

describe('Logic assign', () => {
  test('assign with OR', () => {
    expect(/* cpp */ `
      void main() {
        int a = 2;
        int b = a > 0 || a*2 > 0;
      }
    `).toCompiledIRBeEqual(/* ruby */ `
      # --- Block main ---
      def main():
        a{0}: int*2B = alloca int2B
        *(a{0}: int*2B) = store %2: int2B
        b{0}: int*2B = alloca int2B
        %t{0}: int2B = load a{0}: int*2B
        %t{1}: i1:zf = icmp %t{0}: int2B greater_than %0: int2B
        br %t{1}: i1:zf, true: L1
        L4:
        %t{2}: int2B = load a{0}: int*2B
        %t{3}: int2B = %t{2}: int2B mul %2: int2B
        %t{4}: i1:zf = icmp %t{3}: int2B greater_than %0: int2B
        br %t{4}: i1:zf, true: L1
        jmp L2
        L1:
        *(%t{5}: int2B) = store %1: int2B
        jmp L3
        L2:
        *(%t{5}: int2B) = store %0: int2B
        L3:
        *(b{0}: int*2B) = store %t{5}: int2B
        ret
        end-def
    `);
  });

  test('assign with AND', () => {
    expect(/* cpp */ `
      void main() {
        int a = 2;
        int b = a > 0 && a*2 > 0;
      }
    `).toCompiledIRBeEqual(/* ruby */ `
      # --- Block main ---
      def main():
        a{0}: int*2B = alloca int2B
        *(a{0}: int*2B) = store %2: int2B
        b{0}: int*2B = alloca int2B
        %t{0}: int2B = load a{0}: int*2B
        %t{1}: i1:zf = icmp %t{0}: int2B greater_than %0: int2B
        br %t{1}: i1:zf, false: L2
        L4:
        %t{2}: int2B = load a{0}: int*2B
        %t{3}: int2B = %t{2}: int2B mul %2: int2B
        %t{4}: i1:zf = icmp %t{3}: int2B greater_than %0: int2B
        br %t{4}: i1:zf, true: L1
        jmp L2
        L1:
        *(%t{5}: int2B) = store %1: int2B
        jmp L3
        L2:
        *(%t{5}: int2B) = store %0: int2B
        L3:
        *(b{0}: int*2B) = store %t{5}: int2B
        ret
        end-def
    `);
  });

  test('assign with mixed logic expression', () => {
    expect(/* cpp */ `
      void main() {
        int a = 2;
        int b = a > 0 && (a > 3 || a > 4);
      }
    `).toCompiledIRBeEqual(/* ruby */ `
      # --- Block main ---
      def main():
        a{0}: int*2B = alloca int2B
        *(a{0}: int*2B) = store %2: int2B
        b{0}: int*2B = alloca int2B
        %t{0}: int2B = load a{0}: int*2B
        %t{1}: i1:zf = icmp %t{0}: int2B greater_than %0: int2B
        br %t{1}: i1:zf, false: L2
        L4:
        %t{2}: int2B = load a{0}: int*2B
        %t{3}: i1:zf = icmp %t{2}: int2B greater_than %3: int2B
        br %t{3}: i1:zf, true: L1
        L5:
        %t{4}: int2B = load a{0}: int*2B
        %t{5}: i1:zf = icmp %t{4}: int2B greater_than %4: int2B
        br %t{5}: i1:zf, true: L1
        jmp L2
        jmp L2
        L1:
        *(%t{6}: int2B) = store %1: int2B
        jmp L3
        L2:
        *(%t{6}: int2B) = store %0: int2B
        L3:
        *(b{0}: int*2B) = store %t{6}: int2B
        ret
        end-def
    `);
  });
});
