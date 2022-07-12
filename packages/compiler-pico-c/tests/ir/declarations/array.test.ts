import '../utils/irMatcher';

describe('Arrays declarations IR', () => {
  describe('Uninitialized', () => {
    test('should generate alloc for single dimension array', () => {
      expect(/* cpp */ `void main() { int a[5]; }`).toCompiledIRBeEqual(/* ruby */`
        # --- Block main ---
        def main():
          a{0}: int[5]*2B = alloca int[5]10B
          ret
          end-decl
      `);
    });

    test('should generate alloc for single 2-dimension array', () => {
      expect(/* cpp */ `void main() { int a[5][2]; }`).toCompiledIRBeEqual(/* ruby */`
        # --- Block main ---
        def main():
          a{0}: int[5][2]*2B = alloca int[5][2]20B
          ret
          end-decl
      `);
    });

    test('should generate alloc for single 3-dimension array', () => {
      expect(/* cpp */ `void main() { int a[5][4][2]; }`).toCompiledIRBeEqual(/* ruby */`
        # --- Block main ---
        def main():
          a{0}: int[5][4][2]*2B = alloca int[5][4][2]80B
          ret
          end-decl
      `);
    });
  });

  describe('Initialized', () => {
    test('should generate alloc for single dimension unknown size array', () => {
      expect(/* cpp */ `void main() { int a[] = { 1, 2, 3 }; }`).toCompiledIRBeEqual(/* ruby */`
        # --- Block main ---
        def main():
          a{0}: int[3]*2B = alloca int[3]6B
          *(a{0}: int[3]*2B) = store %1: int2B
          *(a{0}: int[3]*2B + %2) = store %2: int2B
          *(a{0}: int[3]*2B + %4) = store %3: int2B
          ret
          end-decl
      `);
    });

    test('should generate alloc for single dimension fixed size array', () => {
      expect(/* cpp */ `void main() { int a[2] = { 1, 2 }; }`).toCompiledIRBeEqual(/* ruby */`
        # --- Block main ---
        def main():
          a{0}: int[2]*2B = alloca int[2]4B
          *(a{0}: int[2]*2B) = store %1: int2B
          *(a{0}: int[2]*2B + %2) = store %2: int2B
          ret
          end-decl
      `);
    });

    test('should generate label pointer to longer arrays with constant expressions', () => {
      expect(/* cpp */ `void main() { int a[] = { 1, 2, 3, 4, 5 }; }`).toCompiledIRBeEqual(/* ruby */`
        # --- Block main ---
        def main():
          a{0}: int**2B = alloca int*2B
          %t{0}: int*2B = lea c{0}: int[5]10B
          *(a{0}: int**2B) = store %t{0}: int*2B
          ret
          end-decl
        # --- Block Data ---
          c{0}: int[5]10B = const { 1, 2, 3, 4, 5 }
      `);
    });

    test('should not generate label pointer to longer arrays with non constant expressions', () => {
      expect(/* cpp */ `
        void main() {
          int d = 4;
          int a[] = { 1, 2, 3, 4, d };
        }
      `).toCompiledIRBeEqual(/* ruby */`
        # --- Block main ---
        def main():
          d{0}: int*2B = alloca int2B
          *(d{0}: int*2B) = store %4: int2B
          a{0}: int[5]*2B = alloca int[5]10B
          *(a{0}: int[5]*2B) = store %1: int2B
          *(a{0}: int[5]*2B + %2) = store %2: int2B
          *(a{0}: int[5]*2B + %4) = store %3: int2B
          *(a{0}: int[5]*2B + %6) = store %4: int2B
          %t{0}: int2B = load d{0}: int*2B
          *(a{0}: int[5]*2B + %8) = store %t{0}: int2B
          ret
          end-decl
      `);
    });

    test('should string as pointer to label', () => {
      expect(/* cpp */ `void main() { const char* str = "Hello world!"; }`).toCompiledIRBeEqual(/* ruby */`
        # --- Block main ---
        def main():
          str{0}: const char**2B = alloca const char*2B
          %t{0}: const char*2B = lea c{0}: const char[12]12B
          *(str{0}: const char**2B) = store %t{0}: const char*2B
          ret
          end-decl

        # --- Block Data ---
          c{0}: const char[12]12B = const { 72, 101, 108, 108, 111, 32, 119, 111, 114, 108, 100, 33 }
      `);
    });

    test('assign array of structures that are return value', () => {
      expect(/* cpp */ `
        struct Vec2 { int x, y, z, d; };
        struct Vec2 of_vector() {
          struct Vec2 vec = { .x = 0, .d = 0 };
          return vec;
        }

        void main() {
          struct Vec2 vec[] = { of_vector(), of_vector() };
        }
      `).toCompiledIRBeEqual(/* ruby */`
        # --- Block of_vector ---
        def of_vector(%out{0}: struct Vec2**2B):
          vec{0}: struct Vec2*2B = load %out{0}: struct Vec2**2B
          *(vec{0}: struct Vec2*2B) = store %0: int2B
          *(vec{0}: struct Vec2*2B + %6) = store %0: int2B
          ret
          end-decl

        # --- Block main ---
        def main():
          vec{0}: struct Vec2[2]*2B = alloca struct Vec2[2]16B
          %t{1}: struct Vec2 of_vector()*2B = label-offset of_vector
          %t{2}: struct Vec2[2]**2B = lea vec{0}: struct Vec2[2]*2B
          call %t{1}: struct Vec2 of_vector()*2B :: (%t{2}: struct Vec2[2]**2B)
          %t{5}: int*2B = %t{2}: struct Vec2[2]**2B plus %8: int2B
          call %t{1}: struct Vec2 of_vector()*2B :: (%t{5}: int*2B)
          ret
          end-decl
      `);
    });
  });
});
