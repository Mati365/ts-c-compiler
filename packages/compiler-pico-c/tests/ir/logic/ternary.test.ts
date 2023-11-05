import '../utils';

describe('Ternary assign', () => {
  test('simple ternary assign', () => {
    expect(/* cpp */ `
      void main() {
        int k = 4;
        int s = 10;

        int a = k < s ? 1 : 2;
        asm("xchg bx, bx");
      }
    `).toCompiledIRBeEqual(/* ruby */ `
      # --- Block main ---
      def main():
        k{0}: int*2B = alloca int2B
        *(k{0}: int*2B) = store %4: int2B
        s{0}: int*2B = alloca int2B
        *(s{0}: int*2B) = store %10: int2B
        a{0}: int*2B = alloca int2B
        %t{0}: char1B = alloca char1B
        %t{1}: int2B = load k{0}: int*2B
        %t{2}: int2B = load s{0}: int*2B
        %t{3}: i1:zf = icmp %t{1}: int2B less_than %t{2}: int2B
        br %t{3}: i1:zf, false: L3
        L2:
        %t{4}: char1B = assign:φ %1: char1B
        jmp L1
        L3:
        %t{5}: char1B = assign:φ %2: char1B
        L1:
        %t{0}: char1B = φ(%t{4}: char1B, %t{5}: char1B)
        *(a{0}: int*2B) = store %t{0}: char1B
        asm "xchg bx, bx"
        ret
        end-def
    `);
  });

  test('advanced ternary assign', () => {
    expect(/* cpp */ `
      void main() {
        int k = 4;
        int s = 10;

        int d1 = -2;
        int d2 = 11;

        int a = k < s ? d1 + d2 > 10 ? 666 : 4 : 2;
        asm("xchg dx, dx");
      }
    `).toCompiledIRBeEqual(/* ruby */ `
      # --- Block main ---
      def main():
        k{0}: int*2B = alloca int2B
        *(k{0}: int*2B) = store %4: int2B
        s{0}: int*2B = alloca int2B
        *(s{0}: int*2B) = store %10: int2B
        d1{0}: int*2B = alloca int2B
        *(d1{0}: int*2B) = store %-2: int2B
        d2{0}: int*2B = alloca int2B
        *(d2{0}: int*2B) = store %11: int2B
        a{0}: int*2B = alloca int2B
        %t{0}: int2B = alloca int2B
        %t{1}: int2B = load k{0}: int*2B
        %t{2}: int2B = load s{0}: int*2B
        %t{3}: i1:zf = icmp %t{1}: int2B less_than %t{2}: int2B
        br %t{3}: i1:zf, false: L3
        L2:
        %t{6}: int2B = alloca int2B
        %t{7}: int2B = load d1{0}: int*2B
        %t{8}: int2B = load d2{0}: int*2B
        %t{9}: int2B = %t{7}: int2B plus %t{8}: int2B
        %t{10}: i1:zf = icmp %t{9}: int2B greater_than %10: char1B
        br %t{10}: i1:zf, false: L6
        L5:
        %t{11}: int2B = assign:φ %666: int2B
        jmp L4
        L6:
        %t{12}: int2B = assign:φ %4: char1B
        L4:
        %t{6}: int2B = φ(%t{11}: int2B, %t{12}: int2B)
        %t{4}: int2B = assign:φ %t{6}: int2B
        jmp L1
        L3:
        %t{5}: int2B = assign:φ %2: char1B
        L1:
        %t{0}: int2B = φ(%t{4}: int2B, %t{5}: int2B)
        *(a{0}: int*2B) = store %t{0}: int2B
        asm "xchg dx, dx"
        ret
        end-def
    `);
  });

  test('advanced with negative optimized numbers', () => {
    expect(/* cpp */ `
      void main() {
        int k = 5;
        int s = k > 50 ? -1 : 2;

        asm("xchg dx, dx");
      }
    `).toCompiledIRBeEqual(/* ruby */ `
      # --- Block main ---
      def main():
        k{0}: int*2B = alloca int2B
        *(k{0}: int*2B) = store %5: int2B
        s{0}: int*2B = alloca int2B
        %t{0}: char1B = alloca char1B
        %t{1}: int2B = load k{0}: int*2B
        %t{2}: i1:zf = icmp %t{1}: int2B greater_than %50: char1B
        br %t{2}: i1:zf, false: L3
        L2:
        %t{3}: char1B = assign:φ %-1: char1B
        jmp L1
        L3:
        %t{4}: char1B = assign:φ %2: char1B
        L1:
        %t{0}: char1B = φ(%t{3}: char1B, %t{4}: char1B)
        *(s{0}: int*2B) = store %t{0}: char1B
        asm "xchg dx, dx"
        ret
        end-def
    `);
  });

  test('constant eval of ternary operator', () => {
    expect(/* cpp */ `
      int main() {
        int k = 6 < 10 ? 16 : 6;
      }
    `).toCompiledIRBeEqual(/* ruby */ `
      # --- Block main ---
      def main(): [ret: int2B]
        k{0}: int*2B = alloca int2B
        *(k{0}: int*2B) = store %16: int2B
        ret
        end-def
    `);
  });
});
