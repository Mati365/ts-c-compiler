import '../utils';

describe('Assignment IR', () => {
  describe('Primitives', () => {
    test('Assign pre increment: int a = ++i', () => {
      expect(/* cpp */ `void main() { int a, i = 0; a = ++i; }`)
        .toCompiledIRBeEqual(/* ruby */ `
        # --- Block main ---
        def main():
          a{0}: int*2B = alloca int2B
          i{0}: int*2B = alloca int2B
          *(i{0}: int*2B) = store %0: int2B
          %t{0}: int2B = load i{0}: int*2B
          %t{1}: int2B = %t{0}: int2B plus %1: int2B
          *(i{0}: int*2B) = store %t{1}: int2B
          *(a{0}: int*2B) = store %t{1}: int2B
          ret
          end-def
      `);
    });

    test('Assign post increment: int a = i++', () => {
      expect(/* cpp */ `void main() { int a, i = 0; a = i++; }`)
        .toCompiledIRBeEqual(/* ruby */ `
        # --- Block main ---
        def main():
          a{0}: int*2B = alloca int2B
          i{0}: int*2B = alloca int2B
          *(i{0}: int*2B) = store %0: int2B
          %t{0}: int2B = load i{0}: int*2B
          %t{1}: int2B = %t{0}: int2B plus %1: int2B
          *(i{0}: int*2B) = store %t{1}: int2B
          *(a{0}: int*2B) = store %t{0}: int2B
          ret
          end-def
      `);
    });

    test('Assign post increment and pre increment: int a = i++ + ++i', () => {
      expect(/* cpp */ `void main() { int a, i = 0; a = i++ + ++i; }`)
        .toCompiledIRBeEqual(/* ruby */ `
        # --- Block main ---
        def main():
          a{0}: int*2B = alloca int2B
          i{0}: int*2B = alloca int2B
          *(i{0}: int*2B) = store %0: int2B
          %t{0}: int2B = load i{0}: int*2B
          %t{3}: int2B = %t{0}: int2B plus %2: int2B
          *(i{0}: int*2B) = store %t{3}: int2B
          %t{4}: int2B = %t{0}: int2B plus %t{3}: int2B
          *(a{0}: int*2B) = store %t{4}: int2B
          ret
          end-def
      `);
    });

    test('Assign using initializer variable', () => {
      expect(/* cpp */ `
        int sum() {
          int a = 10;
          a = a * (a - 1) + a;
        }
      `).toCompiledIRBeEqual(/* ruby */ `
        # --- Block sum ---
        def sum(): [ret: int2B]
          a{0}: int*2B = alloca int2B
          *(a{0}: int*2B) = store %10: int2B
          %t{0}: int2B = load a{0}: int*2B
          %t{2}: int2B = %t{0}: int2B minus %1: char1B
          %t{3}: int2B = %t{0}: int2B mul %t{2}: int2B
          %t{5}: int2B = %t{3}: int2B plus %t{0}: int2B
          *(a{0}: int*2B) = store %t{5}: int2B
          ret
          end-def
      `);
    });

    test('Optimized assign with mul by 0', () => {
      expect(/* cpp */ `
        void main() {
          int a = 2;
          int b = a * 0 + 10;
        }
      `).toCompiledIRBeEqual(/* ruby */ `
        # --- Block main ---
        def main():
          a{0}: int*2B = alloca int2B
          *(a{0}: int*2B) = store %2: int2B
          b{0}: int*2B = alloca int2B
          *(b{0}: int*2B) = store %10: char1B
          ret
          end-def
      `);
    });
  });

  describe('Arrays', () => {
    test('assignment array to pointer', () => {
      expect(/* cpp */ `
          void main() {
            int arr[] = { 1, 2, 3 };
            int* ptr = arr;
          }
      `).toCompiledIRBeEqual(/* ruby */ `
        # --- Block main ---
        def main():
          arr{0}: int[3]*2B = alloca int[3]6B
          *(arr{0}: int[3]*2B) = store %1: int2B
          *(arr{0}: int[3]*2B + %2) = store %2: int2B
          *(arr{0}: int[3]*2B + %4) = store %3: int2B
          ptr{0}: int**2B = alloca int*2B
          %t{0}: int[3]*2B = lea arr{0}: int[3]*2B
          *(ptr{0}: int**2B) = store %t{0}: int[3]*2B
          ret
          end-def
      `);
    });

    test('multiple array assignments have optimized lea instructions count', () => {
      expect(/* cpp */ `
        void main() {
          int array[] = { 1, 2, 3 };
          array[1] = 3;
          array[2] = 4;
          array[3] = 5;
        }
      `).toCompiledIRBeEqual(/* ruby */ `
        # --- Block main ---
        def main():
          array{0}: int[3]*2B = alloca int[3]6B
          *(array{0}: int[3]*2B) = store %1: int2B
          *(array{0}: int[3]*2B + %2) = store %3: char1B
          *(array{0}: int[3]*2B + %4) = store %4: char1B
          *(array{0}: int[3]*2B + %6) = store %5: char1B
          ret
          end-def
      `);
    });

    test('assignment realocated array to pointer', () => {
      expect(/* cpp */ `
          void main() {
            const int arr[] = { 1, 2, 3, 4, 5, 6 };
            int* ptr = arr;
          }
      `).toCompiledIRBeEqual(/* ruby */ `
        # --- Block main ---
        def main():
          arr{0}: const int**2B = alloca const int*2B
          %t{0}: const int*2B = lea c{0}: const int[6]*2B
          *(arr{0}: const int**2B) = store %t{0}: const int*2B
          ptr{0}: int**2B = alloca int*2B
          %t{1}: const int*2B = load arr{0}: const int**2B
          *(ptr{0}: int**2B) = store %t{1}: const int*2B
          ret
          end-def
          # --- Block Data ---
          c{0}: const int[6]*2B = const { 1, 2, 3, 4, 5, 6 }
      `);
    });

    test('assignment 1-dimension array', () => {
      expect(/* cpp */ `
        void main() {
          int array[] = { 1, 2 };
          int sum = array[1] + 3 * 4;
        }
      `).toCompiledIRBeEqual(/* ruby */ `
        # --- Block main ---
        def main():
          array{0}: int[2]*2B = alloca int[2]4B
          *(array{0}: int[2]*2B) = store %1: int2B
          *(array{0}: int[2]*2B + %2) = store %2: int2B
          sum{0}: int*2B = alloca int2B
          %t{0}: int*2B = lea array{0}: int[2]*2B
          %t{1}: int*2B = %t{0}: int*2B plus %2: int2B
          %t{2}: int2B = load %t{1}: int*2B
          %t{4}: int2B = %t{2}: int2B plus %12: char1B
          *(sum{0}: int*2B) = store %t{4}: int2B
          ret
          end-def
      `);
    });

    test('assignment 1-dimension realocated array', () => {
      expect(/* cpp */ `
        void main() {
          const int array[] = { 1, 2, 3, 4, 5 };
          int sum = array[1] - 3 * 4;
        }
      `).toCompiledIRBeEqual(/* ruby */ `
        # --- Block main ---
        def main():
          array{0}: const int**2B = alloca const int*2B
          %t{0}: const int*2B = lea c{0}: const int[5]*2B
          *(array{0}: const int**2B) = store %t{0}: const int*2B
          sum{0}: int*2B = alloca int2B
          %t{1}: const int*2B = load array{0}: const int**2B
          %t{2}: const int*2B = %t{1}: const int*2B plus %2: int2B
          %t{3}: const int2B = load %t{2}: const int*2B
          %t{5}: const int2B = %t{3}: const int2B minus %12: char1B
          *(sum{0}: int*2B) = store %t{5}: const int2B
          ret
          end-def
          # --- Block Data ---
          c{0}: const int[5]*2B = const { 1, 2, 3, 4, 5 }
      `);
    });

    test('assignment 2-dimension array by single dimension with realocated array', () => {
      expect(/* cpp */ `
        void main() {
          const int array[4][3] = { 1, 2, 3, 4, 5 };
          int sum = array[1] + 3 * 4;
        }
      `).toCompiledIRBeEqual(/* ruby */ `
        # --- Block main ---
        def main():
          array{0}: const int**2B = alloca const int*2B
          %t{0}: const int*2B = lea c{0}: const int[12]*2B
          *(array{0}: const int**2B) = store %t{0}: const int*2B
          sum{0}: int*2B = alloca int2B
          %t{1}: const int*2B = load array{0}: const int**2B
          %t{2}: const int*2B = %t{1}: const int*2B plus %6: int2B
          %t{3}: const int2B = load %t{2}: const int*2B
          %t{5}: const int2B = %t{3}: const int2B plus %12: char1B
          *(sum{0}: int*2B) = store %t{5}: const int2B
          ret
          end-def
          # --- Block Data ---
          c{0}: const int[12]*2B = const { 1, 2, 3, 4, 5, null, null, null, null, null, null, null }
      `);
    });

    test('assignment 2-dimension array with realocated array', () => {
      expect(/* cpp */ `
        void main() {
          const int array[4][3] = { 1, 2, 3, 4, 5 };
          int sum = array[1][0] + 3 * 4;
        }
      `).toCompiledIRBeEqual(/* ruby */ `
        # --- Block main ---
        def main():
          array{0}: const int**2B = alloca const int*2B
          %t{0}: const int*2B = lea c{0}: const int[12]*2B
          *(array{0}: const int**2B) = store %t{0}: const int*2B
          sum{0}: int*2B = alloca int2B
          %t{1}: const int*2B = load array{0}: const int**2B
          %t{2}: const int*2B = %t{1}: const int*2B plus %6: int2B
          %t{3}: const int2B = load %t{2}: const int*2B
          %t{5}: const int2B = %t{3}: const int2B plus %12: char1B
          *(sum{0}: int*2B) = store %t{5}: const int2B
          ret
          end-def
          # --- Block Data ---
          c{0}: const int[12]*2B = const { 1, 2, 3, 4, 5, null, null, null, null, null, null, null }
      `);
    });

    test('assignment 1-dimension array with structures', () => {
      expect(/* cpp */ `
        void main() {
          struct Vec2 { int x, y; } vec[] = { { .y = 4 }, { .x =  5 }};
          int sum = vec[1].x + vec[0].y;
        }
      `).toCompiledIRBeEqual(/* ruby */ `
          # --- Block main ---
          def main():
          vec{0}: struct Vec2[2]*2B = alloca struct Vec2[2]8B
          *(vec{0}: struct Vec2[2]*2B + %2) = store %4: int2B
          *(vec{0}: struct Vec2[2]*2B + %4) = store %5: int2B
          sum{0}: int*2B = alloca int2B
          %t{0}: struct Vec2*2B = lea vec{0}: struct Vec2[2]*2B
          %t{1}: struct Vec2*2B = %t{0}: struct Vec2*2B plus %4: int2B
          %t{2}: int2B = load %t{1}: struct Vec2*2B
          %t{4}: int*2B = %t{0}: struct Vec2*2B plus %2: int2B
          %t{5}: int2B = load %t{4}: int*2B
          %t{6}: int2B = %t{2}: int2B plus %t{5}: int2B
          *(sum{0}: int*2B) = store %t{6}: int2B
          ret
          end-def
      `);
    });

    test('assignment legacy way *(array + 1) = 1 with realocated array', () => {
      expect(/* cpp */ `
        void main() {
          int testArray[] = { 1, 2, 3, 4, 5 };
          *(1 + testArray + (2 * 3)) = 4;
        }
      `).toCompiledIRBeEqual(/* ruby */ `
        # --- Block main ---
        def main():
          testArray{0}: int[5]*2B = alloca int[5]10B
          *(testArray{0}: int[5]*2B) = store %1: int2B
          *(testArray{0}: int[5]*2B + %2) = store %2: int2B
          *(testArray{0}: int[5]*2B + %4) = store %3: int2B
          *(testArray{0}: int[5]*2B + %6) = store %4: int2B
          *(testArray{0}: int[5]*2B + %8) = store %5: int2B
          *(testArray{0}: int[5]*2B + %14) = store %4: char1B
          ret
          end-def
      `);
    });

    test('assignment legacy way *(array + 1) = 1 without realocated array', () => {
      expect(/* cpp */ `
        void main() {
          int testArray[] = { 1, 2, 3 };
          *(1 + testArray + (2 * 3)) = 4;
        }
      `).toCompiledIRBeEqual(/* ruby */ `
        # --- Block main ---
        def main():
          testArray{0}: int[3]*2B = alloca int[3]6B
          *(testArray{0}: int[3]*2B) = store %1: int2B
          *(testArray{0}: int[3]*2B + %2) = store %2: int2B
          *(testArray{0}: int[3]*2B + %4) = store %3: int2B
          *(testArray{0}: int[3]*2B + %14) = store %4: char1B
          ret
          end-def
      `);
    });
  });

  describe('Pointer', () => {
    test('assign address to pointer', () => {
      expect(/* cpp */ `
        void main() {
          int b = 4;
          int* a;
          a = &b;
        }
      `).toCompiledIRBeEqual(/* ruby */ `
        # --- Block main ---
        def main():
          b{0}: int*2B = alloca int2B
          *(b{0}: int*2B) = store %4: int2B
          a{0}: int**2B = alloca int*2B
          %t{0}: int*2B = lea b{0}: int*2B
          *(a{0}: int**2B) = store %t{0}: int*2B
          ret
          end-def
      `);
    });

    test('assign value to pointing value', () => {
      expect(/* cpp */ `
        void main() {
          int b = 4;
          int* a = &b;
          (*a) = 5;
        }
      `).toCompiledIRBeEqual(/* ruby */ `
        # --- Block main ---
          def main():
          b{0}: int*2B = alloca int2B
          *(b{0}: int*2B) = store %4: int2B
          a{0}: int**2B = alloca int*2B
          %t{0}: int*2B = lea b{0}: int*2B
          *(a{0}: int**2B) = store %t{0}: int*2B
          %t{1}: int*2B = load a{0}: int**2B
          *(%t{1}: int*2B) = store %5: char1B
          ret
          end-def
      `);
    });

    test('addition pointer + 4 should mul constant', () => {
      expect(/* cpp */ `
        void main() {
          int b = 4;
          int* a = &b;
          int c = a + 5;
        }
      `).toCompiledIRBeEqual(/* ruby */ `
        # --- Block main ---
          def main():
          b{0}: int*2B = alloca int2B
          *(b{0}: int*2B) = store %4: int2B
          a{0}: int**2B = alloca int*2B
          %t{0}: int*2B = lea b{0}: int*2B
          *(a{0}: int**2B) = store %t{0}: int*2B
          c{0}: int*2B = alloca int2B
          %t{1}: int*2B = load a{0}: int**2B
          %t{3}: int*2B = %t{1}: int*2B plus %10: char1B
          *(c{0}: int*2B) = store %t{3}: int*2B
          ret
          end-def
      `);
    });

    test('addition *pointer + 4 should not mul constant', () => {
      expect(/* cpp */ `
        void main() {
          int b = 4;
          int* a = &b;
          int c = *a + 5;
        }
      `).toCompiledIRBeEqual(/* ruby */ `
        # --- Block main ---
          def main():
          b{0}: int*2B = alloca int2B
          *(b{0}: int*2B) = store %4: int2B
          a{0}: int**2B = alloca int*2B
          %t{0}: int*2B = lea b{0}: int*2B
          *(a{0}: int**2B) = store %t{0}: int*2B
          c{0}: int*2B = alloca int2B
          %t{1}: int*2B = load a{0}: int**2B
          %t{2}: int2B = load %t{1}: int*2B
          %t{3}: int2B = %t{2}: int2B plus %5: char1B
          *(c{0}: int*2B) = store %t{3}: int2B
          ret
          end-def
      `);
    });

    test('array like access assign to pointers', () => {
      expect(/* cpp */ `
        void main() {
          int arr[] = { 1, 2, 3, 4, 5, 6 };
          int* ptr = arr;
          ptr[2] = 2 *4;
        }
      `).toCompiledIRBeEqual(/* ruby */ `
        # --- Block main ---
          def main():
          arr{0}: int[6]*2B = alloca int[6]12B
          *(arr{0}: int[6]*2B) = store %1: int2B
          *(arr{0}: int[6]*2B + %2) = store %2: int2B
          *(arr{0}: int[6]*2B + %4) = store %3: int2B
          *(arr{0}: int[6]*2B + %6) = store %4: int2B
          *(arr{0}: int[6]*2B + %8) = store %5: int2B
          *(arr{0}: int[6]*2B + %10) = store %6: int2B
          ptr{0}: int**2B = alloca int*2B
          %t{0}: int[6]*2B = lea arr{0}: int[6]*2B
          *(ptr{0}: int**2B) = store %t{0}: int[6]*2B
          %t{1}: int*2B = load ptr{0}: int**2B
          %t{2}: int*2B = %t{1}: int*2B plus %4: int2B
          *(%t{2}: int*2B) = store %8: char1B
          ret
          end-def
      `);
    });
  });

  describe('Structures', () => {
    test('assign value to field member', () => {
      expect(/* cpp */ `
        void main() {
          struct Vec2 { int x, y; } vec = { .y = 5 };
          vec.y = 7;
        }
      `).toCompiledIRBeEqual(/* ruby */ `
        # --- Block main ---
        def main():
          vec{0}: struct Vec2*2B = alloca struct Vec24B
          *(vec{0}: struct Vec2*2B + %2) = store %7: char1B
          ret
          end-def
      `);
    });

    test('assign nested values', () => {
      expect(/* cpp */ `
        void main() {
          struct Vec2 { int x, y; struct Rect { int s, w; } k; } vec = { .y = 5 };
          vec.y = 7;
          vec.k.w = 2;
        }
      `).toCompiledIRBeEqual(/* ruby */ `
        # --- Block main ---
        def main():
          vec{0}: struct Vec2*2B = alloca struct Vec28B
          *(vec{0}: struct Vec2*2B + %2) = store %7: char1B
          *(vec{0}: struct Vec2*2B + %6) = store %2: char1B
          ret
          end-def
      `);
    });

    test('pointer assign field access', () => {
      expect(/* cpp */ `
        struct Vec2 { int x, y; };

        void main() {
          struct Vec2 vec = { .y = 5 };
          struct Vec2* ptr = &vec;
          ptr->y = 5;
        }
      `).toCompiledIRBeEqual(/* ruby */ `
        # --- Block main ---
        def main():
          vec{0}: struct Vec2*2B = alloca struct Vec24B
          *(vec{0}: struct Vec2*2B + %2) = store %5: int2B
          ptr{0}: struct Vec2**2B = alloca struct Vec2*2B
          %t{0}: struct Vec2*2B = lea vec{0}: struct Vec2*2B
          *(ptr{0}: struct Vec2**2B) = store %t{0}: struct Vec2*2B
          %t{1}: struct Vec2*2B = load ptr{0}: struct Vec2**2B
          %t{2}: int*2B = %t{1}: struct Vec2*2B plus %2: int2B
          *(%t{2}: int*2B) = store %5: char1B
          ret
          end-def
      `);
    });

    test('loads pointer field data', () => {
      expect(/* cpp */ `
        struct Vec2 { int x, y; };

        void main() {
          struct Vec2 vec = { .y = 5 };
          struct Vec2* ptr = &vec;
          ptr->y = 5;

          int d = ptr->y;
        }
      `).toCompiledIRBeEqual(/* ruby */ `
        # --- Block main ---
        def main():
          vec{0}: struct Vec2*2B = alloca struct Vec24B
          *(vec{0}: struct Vec2*2B + %2) = store %5: int2B
          ptr{0}: struct Vec2**2B = alloca struct Vec2*2B
          %t{0}: struct Vec2*2B = lea vec{0}: struct Vec2*2B
          *(ptr{0}: struct Vec2**2B) = store %t{0}: struct Vec2*2B
          %t{1}: struct Vec2*2B = load ptr{0}: struct Vec2**2B
          %t{2}: int*2B = %t{1}: struct Vec2*2B plus %2: int2B
          *(%t{2}: int*2B) = store %5: char1B
          d{0}: int*2B = alloca int2B
          %t{4}: int*2B = %t{0}: struct Vec2*2B plus %2: int2B
          %t{5}: int2B = load %t{4}: int*2B
          *(d{0}: int*2B) = store %t{5}: int2B
          ret
          end-def
      `);
    });

    test('loads pointer to array of structs', () => {
      expect(/* cpp */ `
        struct Vec2 {
          int x, y;
          struct Rect { int s, w; } k;
        };

        void main() {
          struct Vec2 vec[] = { { .y = 5 }, { .x = 2 } };
          struct Vec2 (*ptr)[] = &vec;
        }
      `).toCompiledIRBeEqual(/* ruby */ `
        # --- Block main ---
        def main():
          vec{0}: struct Vec2[2]*2B = alloca struct Vec2[2]16B
          *(vec{0}: struct Vec2[2]*2B + %2) = store %5: int2B
          *(vec{0}: struct Vec2[2]*2B + %8) = store %2: int2B
          ptr{0}: struct Vec2[]**2B = alloca struct Vec2[]*2B
          %t{0}: struct Vec2*2B = lea vec{0}: struct Vec2[2]*2B
          *(ptr{0}: struct Vec2[]**2B) = store %t{0}: struct Vec2*2B
          ret
          end-def
      `);
    });
  });
});
