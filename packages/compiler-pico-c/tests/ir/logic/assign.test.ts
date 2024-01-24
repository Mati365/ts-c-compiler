import '../utils';

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
        %t{3}: int2B = load a{0}: int*2B
        %t{4}: i1:zf = icmp %t{3}: int2B greater_than %0: char1B
        br %t{4}: i1:zf, true: L1
        L4:
        %t{5}: int2B = load a{0}: int*2B
        %t{6}: int2B = %t{5}: int2B mul %2: char1B
        %t{7}: i1:zf = icmp %t{6}: int2B greater_than %0: char1B
        br %t{7}: i1:zf, false: L2
        L1:
        %t{0}: int2B = assign:φ %1: int2B
        jmp L3
        L2:
        %t{1}: int2B = assign:φ %0: int2B
        L3:
        %t{2}: int2B = φ(%t{0}: int2B, %t{1}: int2B)
        *(b{0}: int*2B) = store %t{2}: int2B
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
        %t{3}: int2B = load a{0}: int*2B
        %t{4}: i1:zf = icmp %t{3}: int2B greater_than %0: char1B
        br %t{4}: i1:zf, false: L2
        L4:
        %t{5}: int2B = load a{0}: int*2B
        %t{6}: int2B = %t{5}: int2B mul %2: char1B
        %t{7}: i1:zf = icmp %t{6}: int2B greater_than %0: char1B
        br %t{7}: i1:zf, false: L2
        L1:
        %t{0}: int2B = assign:φ %1: int2B
        jmp L3
        L2:
        %t{1}: int2B = assign:φ %0: int2B
        L3:
        %t{2}: int2B = φ(%t{0}: int2B, %t{1}: int2B)
        *(b{0}: int*2B) = store %t{2}: int2B
        ret
        end-def
    `);
  });

  test('assign a > 3 && 0', () => {
    expect(/* cpp */ `
      void main() {
        int a = 14;
        int b = a > 3 && 0;
      }
    `).toCompiledIRBeEqual(/* ruby */ `
      # --- Block main ---
      def main():
        a{0}: int*2B = alloca int2B
        *(a{0}: int*2B) = store %14: int2B
        b{0}: int*2B = alloca int2B
        %t{3}: int2B = load a{0}: int*2B
        %t{4}: i1:zf = icmp %t{3}: int2B greater_than %3: char1B
        br %t{4}: i1:zf, false: L2
        L4:
        jmp L2
        L1:
        %t{0}: int2B = assign:φ %1: int2B
        jmp L3
        L2:
        %t{1}: char1B = assign:φ %0: int2B
        L3:
        %t{2}: int2B = φ(%t{0}: int2B, %t{1}: char1B)
        *(b{0}: int*2B) = store %t{2}: int2B
        ret
        end-def
    `);
  });

  test('assign a > 3 && 1', () => {
    expect(/* cpp */ `
      void main() {
        int a = 14;
        int b = a > 3 && 1;
      }
    `).toCompiledIRBeEqual(/* ruby */ `
      # --- Block main ---
        def main():
        a{0}: int*2B = alloca int2B
        *(a{0}: int*2B) = store %14: int2B
        b{0}: int*2B = alloca int2B
        %t{3}: int2B = load a{0}: int*2B
        %t{4}: i1:zf = icmp %t{3}: int2B greater_than %3: char1B
        br %t{4}: i1:zf, false: L2
        L4:
        %t{0}: int2B = assign:φ %1: int2B
        jmp L3
        L2:
        %t{1}: char1B = assign:φ %0: int2B
        L3:
        %t{2}: int2B = φ(%t{0}: int2B, %t{1}: char1B)
        *(b{0}: int*2B) = store %t{2}: int2B
        ret
        end-def
    `);
  });

  test('assign a > 3 || 0', () => {
    expect(/* cpp */ `
      void main() {
        int a = 14;
        int b = a > 3 || 0;
      }
    `).toCompiledIRBeEqual(/* ruby */ `
      # --- Block main ---
      def main():
        a{0}: int*2B = alloca int2B
        *(a{0}: int*2B) = store %14: int2B
        b{0}: int*2B = alloca int2B
        %t{3}: int2B = load a{0}: int*2B
        %t{4}: i1:zf = icmp %t{3}: int2B greater_than %3: char1B
        br %t{4}: i1:zf, true: L1
        L4:
        jmp L2
        L1:
        %t{0}: int2B = assign:φ %1: int2B
        jmp L3
        L2:
        %t{1}: char1B = assign:φ %0: int2B
        L3:
        %t{2}: int2B = φ(%t{0}: int2B, %t{1}: char1B)
        *(b{0}: int*2B) = store %t{2}: int2B
        ret
        end-def
    `);
  });

  test('assign a < 3 || 0', () => {
    expect(/* cpp */ `
      void main() {
        int a = 14;
        int b = a < 3 || 1;
      }
    `).toCompiledIRBeEqual(/* ruby */ `
      # --- Block main ---
      def main():
        a{0}: int*2B = alloca int2B
        *(a{0}: int*2B) = store %14: int2B
        b{0}: int*2B = alloca int2B
        %t{3}: int2B = load a{0}: int*2B
        %t{4}: i1:zf = icmp %t{3}: int2B less_than %3: char1B
        br %t{4}: i1:zf, true: L4
        L4:
        %t{0}: int2B = assign:φ %1: int2B
        jmp L3
        L2:
        %t{1}: char1B = assign:φ %0: int2B
        L3:
        %t{2}: int2B = φ(%t{0}: int2B, %t{1}: char1B)
        *(b{0}: int*2B) = store %t{2}: int2B
        ret
        end-def
    `);
  });

  test('assign 0 && a > 2', () => {
    expect(/* cpp */ `
      void main() {
        int a = 14;
        int b = 0 && a > 2;
      }
    `).toCompiledIRBeEqual(/* ruby */ `
      # --- Block main ---
        def main():
        a{0}: int*2B = alloca int2B
        *(a{0}: int*2B) = store %14: int2B
        b{0}: int*2B = alloca int2B
        jmp L2
        L4:
        %t{3}: int2B = load a{0}: int*2B
        %t{4}: i1:zf = icmp %t{3}: int2B greater_than %2: char1B
        br %t{4}: i1:zf, false: L2
        L1:
        %t{0}: char1B = assign:φ %1: char1B
        jmp L3
        L2:
        %t{1}: int2B = assign:φ %0: char1B
        L3:
        %t{2}: char1B = φ(%t{0}: char1B, %t{1}: int2B)
        %t{5}: int2B = cast %t{2}: char1B
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
        %t{3}: int2B = load a{0}: int*2B
        %t{4}: i1:zf = icmp %t{3}: int2B greater_than %0: char1B
        br %t{4}: i1:zf, false: L2
        L4:
        %t{5}: int2B = load a{0}: int*2B
        %t{6}: i1:zf = icmp %t{5}: int2B greater_than %3: char1B
        br %t{6}: i1:zf, true: L1
        L5:
        %t{7}: int2B = load a{0}: int*2B
        %t{8}: i1:zf = icmp %t{7}: int2B greater_than %4: char1B
        br %t{8}: i1:zf, false: L2
        L1:
        %t{0}: int2B = assign:φ %1: int2B
        jmp L3
        L2:
        %t{1}: int2B = assign:φ %0: int2B
        L3:
        %t{2}: int2B = φ(%t{0}: int2B, %t{1}: int2B)
        *(b{0}: int*2B) = store %t{2}: int2B
        ret
        end-def
    `);
  });
});
