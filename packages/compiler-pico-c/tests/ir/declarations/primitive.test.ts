import '../utils/irMatcher';

describe('Primitive declarations IR', () => {
  describe('Uninitialized', () => {
    test('should generate alloc for int type', () => {
      expect(/* cpp */ `void main() { int a; }`)
        .toCompiledIRBeEqual(/* ruby */ `
        # --- Block main ---
        def main():
          a{0}: int*2B = alloca int2B
          ret
          end-def
      `);
    });

    test('should generate alloc for char type', () => {
      expect(/* cpp */ `void main() { char a; }`)
        .toCompiledIRBeEqual(/* ruby */ `
        # --- Block main ---
        def main():
          a{0}: char*2B = alloca char1B
          ret
          end-def
      `);
    });

    test('should generate alloc for qualifier / specifier type', () => {
      expect(/* cpp */ `void main() { unsigned int a; }`)
        .toCompiledIRBeEqual(/* ruby */ `
        # --- Block main ---
        def main():
          a{0}: unsigned int*2B = alloca unsigned int2B
          ret
          end-def
      `);
    });
  });

  describe('Initialized', () => {
    test('should generate alloc for int type', () => {
      expect(/* cpp */ `void main() { int a = 2; }`)
        .toCompiledIRBeEqual(/* ruby */ `
        # --- Block main ---
        def main():
          a{0}: int*2B = alloca int2B
          *(a{0}: int*2B) = store %2: int2B
          ret
          end-def
      `);
    });

    test('should generate alloc for char type', () => {
      expect(/* cpp */ `void main() { char a = 'a'; }`)
        .toCompiledIRBeEqual(/* ruby */ `
        # --- Block main ---
        def main():
          a{0}: char*2B = alloca char1B
          *(a{0}: char*2B) = store %97: char1B
          ret
          end-def
      `);
    });
  });
});
