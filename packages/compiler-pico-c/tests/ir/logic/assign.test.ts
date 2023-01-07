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
        %t{2}: int2B = load a{0}: int*2B
        %t{3}: int2B = %t{2}: int2B mul %2: int2B
        %t{4}: i1:zf = icmp %t{3}: int2B greater_than %0: int2B
        %t{5}: i1:zf = %t{1}: i1:zf or %t{4}: i1:zf
        *(b{0}: int*2B) = store %t{5}: i1:zf
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
        %t{2}: int2B = load a{0}: int*2B
        %t{3}: int2B = %t{2}: int2B mul %2: int2B
        %t{4}: i1:zf = icmp %t{3}: int2B greater_than %0: int2B
        %t{5}: i1:zf = %t{1}: i1:zf and %t{4}: i1:zf
        *(b{0}: int*2B) = store %t{5}: i1:zf
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
        %t{2}: int2B = load a{0}: int*2B
        %t{3}: i1:zf = icmp %t{2}: int2B greater_than %3: int2B
        %t{4}: int2B = load a{0}: int*2B
        %t{5}: i1:zf = icmp %t{4}: int2B greater_than %4: int2B
        %t{6}: i1:zf = %t{3}: i1:zf or %t{5}: i1:zf
        %t{7}: i1:zf = %t{1}: i1:zf and %t{6}: i1:zf
        *(b{0}: int*2B) = store %t{7}: i1:zf
        ret
        end-def
    `);
  });
});
