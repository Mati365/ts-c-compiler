import '../utils';

describe('Sizeof', () => {
  test('sizeof(int)', () => {
    expect(/* cpp */ `
      int main() {
        int k = sizeof(int);
      }
    `).toCompiledIRBeEqual(/* ruby */ `
      # --- Block main ---
      def main(): [ret: int2B]
        k{0}: int*2B = alloca int2B
        *(k{0}: int*2B) = store %2: int2B
        ret
        end-def
    `);
  });

  test('sizeof(int[2])', () => {
    expect(/* cpp */ `
      int main() {
        int k = sizeof(int[2]);
      }
    `).toCompiledIRBeEqual(/* ruby */ `
      # --- Block main ---
      def main(): [ret: int2B]
        k{0}: int*2B = alloca int2B
        *(k{0}: int*2B) = store %4: int2B
        ret
        end-def
    `);
  });

  test('sizeof(int[2][2 + 1])', () => {
    expect(/* cpp */ `
      int main() {
        int k = sizeof(int[2][2  +1]);
      }
    `).toCompiledIRBeEqual(/* ruby */ `
      # --- Block main ---
      def main(): [ret: int2B]
        k{0}: int*2B = alloca int2B
        *(k{0}: int*2B) = store %12: int2B
        ret
        end-def
    `);
  });

  test('sizeof advanced', () => {
    expect(/* cpp */ `
      int main() {
        int k[2] = { 66, 77 };
        int a = sizeof(k[1]);
        int ab = sizeof(char[4][2][3]);
      }
    `).toCompiledIRBeEqual(/* ruby */ `
      # --- Block main ---
      def main(): [ret: int2B]
        k{0}: int[2]*2B = alloca int[2]4B
        *(k{0}: int[2]*2B) = store %66: int2B
        *(k{0}: int[2]*2B + %2) = store %77: int2B
        a{0}: int*2B = alloca int2B
        *(a{0}: int*2B) = store %2: int2B
        ab{0}: int*2B = alloca int2B
        *(ab{0}: int*2B) = store %24: int2B
        ret
        end-def
    `);
  });
});
