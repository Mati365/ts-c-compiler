import '../utils';

describe('Pointer declarations IR', () => {
  describe('Uninitialized', () => {
    test('should generate alloc for int* type', () => {
      expect(/* cpp */ `void main() { int* a; }`)
        .toCompiledIRBeEqual(/* ruby */ `
        # --- Block main ---
        def main():
          a{0}: int**2B = alloca int*2B
          ret
          end-def
      `);
    });

    test('should generate alloc for int* var[5] type', () => {
      expect(/* cpp */ `void main() { int* var[5]; }`)
        .toCompiledIRBeEqual(/* ruby */ `
        # --- Block main ---
        def main():
          var{0}: int*[5]*2B = alloca int*[5]10B
          ret
          end-def
      `);
    });

    test('should generate alloc for int (*var)[5] type', () => {
      expect(/* cpp */ `void main() { int (*var)[5]; }`)
        .toCompiledIRBeEqual(/* ruby */ `
        # --- Block main ---
        def main():
          var{0}: int[5]**2B = alloca int[5]*2B
          ret
          end-def
      `);
    });

    test('should generate alloc for int** (*var)[5] type', () => {
      expect(/* cpp */ `void main() { int** (*var)[5]; }`)
        .toCompiledIRBeEqual(/* ruby */ `
        # --- Block main ---
        def main():
          var{0}: int**[5]**2B = alloca int**[5]*2B
          ret
          end-def
      `);
    });

    test('should generate alloc for int** (*var)[3][5] type', () => {
      expect(/* cpp */ `void main() { int** (*var)[3][5]; }`)
        .toCompiledIRBeEqual(/* ruby */ `
        # --- Block main ---
        def main():
          var{0}: int**[3][5]**2B = alloca int**[3][5]*2B
          ret
          end-def
      `);
    });

    test('should generate alloc for int** (*var[1][2])[3][5] type', () => {
      expect(/* cpp */ `void main() { int** (*var[1][2])[3][5]; }`)
        .toCompiledIRBeEqual(/* ruby */ `
        # --- Block main ---
        def main():
          var{0}: int**[3][5]*[1][2]*2B = alloca int**[3][5]*[1][2]4B
          ret
          end-def
      `);
    });
  });

  describe('Initialized', () => {
    test('add to pointer without address unary', () => {
      expect(/* cpp */ `
        void main() {
          int a = 123;
          int* b = a + 2;
        }
      `).toCompiledIRBeEqual(/* ruby */ `
        # --- Block main ---
        def main():
          a{0}: int*2B = alloca int2B
          *(a{0}: int*2B) = store %123: int2B
          b{0}: int**2B = alloca int*2B
          %t{0}: int2B = load a{0}: int*2B
          %t{1}: int2B = %t{0}: int2B plus %2: char1B
          *(b{0}: int**2B) = store %t{1}: int2B
          ret
          end-def
      `);
    });

    test('loads pointer pointing value and adds to primitive', () => {
      expect(/* cpp */ `
        void main() {
          int a = 123;
          int* b = &a;
          int c = *b + 4;
        }
      `).toCompiledIRBeEqual(/* ruby */ `
        # --- Block main ---
        def main():
          a{0}: int*2B = alloca int2B
          *(a{0}: int*2B) = store %123: int2B
          b{0}: int**2B = alloca int*2B
          %t{0}: int*2B = lea a{0}: int*2B
          *(b{0}: int**2B) = store %t{0}: int*2B
          c{0}: int*2B = alloca int2B
          %t{1}: int*2B = load b{0}: int**2B
          %t{2}: int2B = load %t{1}: int*2B
          %t{3}: int2B = %t{2}: int2B plus %4: char1B
          *(c{0}: int*2B) = store %t{3}: int2B
          ret
          end-def
      `);
    });

    test('loads array pointer as primitive', () => {
      expect(/* cpp */ `
        void main() {
          const int arr[] = { 1, 2, 3, 4, 5, 6 };
          int ptr = *arr;
        }
      `).toCompiledIRBeEqual(/* ruby */ `
        # --- Block main ---
        def main():
          arr{0}: const int**2B = alloca const int*2B
          %t{0}: const int*2B = lea c{0}: const int[6]12B
          *(arr{0}: const int**2B) = store %t{0}: const int*2B
          ptr{0}: int*2B = alloca int2B
          %t{1}: const int*2B = load arr{0}: const int**2B
          %t{2}: const int2B = load %t{1}: const int*2B
          *(ptr{0}: int*2B) = store %t{2}: const int2B
          ret
          end-def
          # --- Block Data ---
          c{0}: const int[6]12B = const { 1, 2, 3, 4, 5, 6 }
      `);
    });

    test('function pointer declaration without initialize', () => {
      expect(/* cpp */ `
        int sum(int x, int y) {
          return x + y;
        }
        void main() {
          float* (*fun_ptr)(int**, const char* s);
        }
      `).toCompiledIRBeEqual(/* ruby */ `
        # --- Block sum ---
        def sum(x{0}: int*2B, y{0}: int*2B): [ret: int2B]
          %t{0}: int2B = load x{0}: int*2B
          %t{1}: int2B = load y{0}: int*2B
          %t{2}: int2B = %t{0}: int2B plus %t{1}: int2B
          ret %t{2}: int2B
          end-def

        # --- Block main ---
        def main():
          fun_ptr{0}: float*(int**, const char*)**2B = alloca float*(int**, const char*)*2B
          ret
          end-def
      `);
    });

    test('function pointer declaration with initializer', () => {
      expect(/* cpp */ `
        int sum(int x, int y) {
          return x + y;
        }
        void main() {
          int (*fun_ptr)(int, int) = sum;
          int (*fun_ptr2)(int, int) = &sum;
          fun_ptr2 = sum;
        }
      `).toCompiledIRBeEqual(/* ruby */ `
        # --- Block sum ---
        def sum(x{0}: int*2B, y{0}: int*2B): [ret: int2B]
          %t{0}: int2B = load x{0}: int*2B
          %t{1}: int2B = load y{0}: int*2B
          %t{2}: int2B = %t{0}: int2B plus %t{1}: int2B
          ret %t{2}: int2B
          end-def

        # --- Block main ---
        def main():
          fun_ptr{0}: int(int, int)**2B = alloca int(int, int)*2B
          %t{3}: int sum(int, int)*2B = label-offset sum
          *(fun_ptr{0}: int(int, int)**2B) = store %t{3}: int sum(int, int)*2B
          fun_ptr2{0}: int(int, int)**2B = alloca int(int, int)*2B
          *(fun_ptr2{0}: int(int, int)**2B) = store %t{3}: int sum(int, int)*2B
          ret
          end-def
      `);
    });
  });
});
