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
        L2:
        ret
        end-def
    `);
  });

  test('while(0)', () => {
    expect(/* cpp */ `
      void main() {
        while(0) {
          int a = 2;
        }
      }
    `).toCompiledIRBeEqual(/* ruby */ `
      # --- Block main ---
      def main():
        L1:
        jmp L2
        a{0}: int*2B = alloca int2B
        *(a{0}: int*2B) = store %2: int2B
        jmp L1
        L2:
        ret
        end-def
    `);
  });

  test('while(1)', () => {
    expect(/* cpp */ `
      void main() {
        while(1) {
          int a = 2;
        }
      }
    `).toCompiledIRBeEqual(/* ruby */ `
      # --- Block main ---
      def main():
        L1:
        a{0}: int*2B = alloca int2B
        *(a{0}: int*2B) = store %2: int2B
        jmp L1
        L2:
        ret
        end-def

    `);
  });

  test('do while(1)', () => {
    expect(/* cpp */ `
      void main() {
        do {
          int a = 2;
        } while(1);
      }
    `).toCompiledIRBeEqual(/* ruby */ `
      # --- Block main ---
      def main():
        L1:
        a{0}: int*2B = alloca int2B
        *(a{0}: int*2B) = store %2: int2B
        jmp L1
        L2:
        ret
        end-def
    `);
  });

  test('do while(0)', () => {
    expect(/* cpp */ `
      void main() {
        do {
          int a = 2;
        } while(0);
      }
    `).toCompiledIRBeEqual(/* ruby */ `
      # --- Block main ---
      def main():
        L1:
        a{0}: int*2B = alloca int2B
        *(a{0}: int*2B) = store %2: int2B
        L2:
        ret
        end-def
    `);
  });
});
