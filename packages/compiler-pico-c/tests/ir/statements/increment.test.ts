import '../utils/irMatcher';

describe('Increment stmt IR', () => {
  describe('post increment', () => {
    test('should genenerate i++ IR', () => {
      expect(/* cpp */ `void main() { int a; a++; }`).toCompiledIRBeEqual(/* ruby */`
        # --- Block main ---
        def main(): [ret 0B]
          a{0}: int*2B = alloca int2B
          t{0}: int2B = load a{0}: int*2B
          t{1}: int2B = t{0}: int2B PLUS %1: int2B
          *(a{0}: int*2B) = store t{1}: int2B
          ret
      `);
    });

    test('should genenerate *ptr++ IR', () => {
      expect(/* cpp */ `void main() { int* a; *a++; }`).toCompiledIRBeEqual(/* ruby */`
        # --- Block main ---
        def main(): [ret 0B]
          a{0}: int**2B = alloca int*2B
          t{0}: int*2B = load a{0}: int**2B
          t{1}: int*2B = t{0}: int*2B PLUS %2: int2B
          *(a{0}: int**2B) = store t{1}: int*2B
          t{2}: int2B = load t{0}: int*2B
          ret
      `);
    });

    test('should genenerate *(ptr++) IR', () => {
      expect(/* cpp */ `void main() { int* a; *(a++); }`).toCompiledIRBeEqual(/* ruby */`
        # --- Block main ---
        def main(): [ret 0B]
          a{0}: int**2B = alloca int*2B
          t{0}: int*2B = load a{0}: int**2B
          t{1}: int*2B = t{0}: int*2B PLUS %2: int2B
          *(a{0}: int**2B) = store t{1}: int*2B
          t{2}: int2B = load t{0}: int*2B
          ret
      `);
    });

    test('should genenerate (*ptr)++ IR', () => {
      expect(/* cpp */ `void main() { int* a; (*a)++; }`).toCompiledIRBeEqual(/* ruby */`
        # --- Block main ---
        def main(): [ret 0B]
          a{0}: int**2B = alloca int*2B
          t{0}: int*2B = load a{0}: int**2B
          t{1}: int2B = load t{0}: int*2B
          t{2}: int2B = t{1}: int2B PLUS %1: int2B
          *(t{0}: int*2B) = store t{2}: int2B
          ret
      `);
    });
  });

  describe('pre increment', () => {
    test('should genenerate ++i IR', () => {
      expect(/* cpp */ `void main() { int a; ++a; }`).toCompiledIRBeEqual(/* ruby */`
        # --- Block main ---
        def main(): [ret 0B]
          a{0}: int*2B = alloca int2B
          t{0}: int2B = load a{0}: int*2B
          t{1}: int2B = t{0}: int2B PLUS %1: int2B
          *(a{0}: int*2B) = store t{1}: int2B
          ret
      `);
    });

    test('should genenerate ++(*ptr) IR', () => {
      expect(/* cpp */ `void main() { int* ptr; ++(*ptr); }`).toCompiledIRBeEqual(/* ruby */`
        # --- Block main ---
        def main(): [ret 0B]
          ptr{0}: int**2B = alloca int*2B
          t{0}: int*2B = load ptr{0}: int**2B
          t{1}: int2B = load t{0}: int*2B
          t{2}: int2B = t{1}: int2B PLUS %1: int2B
          *(t{0}: int*2B) = store t{2}: int2B
          ret
      `);
    });

    test('should genenerate *(++ptr) IR', () => {
      expect(/* cpp */ `void main() { int* ptr; *(++ptr); }`).toCompiledIRBeEqual(/* ruby */`
        # --- Block main ---
        def main(): [ret 0B]
          ptr{0}: int**2B = alloca int*2B
          t{0}: int*2B = load ptr{0}: int**2B
          t{1}: int*2B = t{0}: int*2B PLUS %2: int2B
          *(ptr{0}: int**2B) = store t{1}: int*2B
          t{2}: int2B = load t{1}: int*2B
          ret
      `);
    });
  });
});
