import '../utils/irMatcher';

describe('Assignment IR', () => {
  describe('Primitives', () => {
    test('Assign pre increment: int a = ++i', () => {
      expect(/* cpp */ `void main() { int a, i = 0; a = ++i; }`).toCompiledIRBeEqual(/* ruby */`
        # --- Block main ---
        def main(): [ret 0B]
          a{0}: int*2B = alloca int2B
          i{0}: int*2B = alloca int2B
          *(i{0}: int*2B) = store %0: int2B
          t{0}: int2B = load i{0}: int*2B
          t{1}: int2B = t{0}: int2B PLUS %1: int2B
          *(i{0}: int*2B) = store t{1}: int2B
          *(a{0}: int*2B) = store t{1}: int2B
          ret
      `);
    });

    test('Assign post increment: int a = i++', () => {
      expect(/* cpp */ `void main() { int a, i = 0; a = i++; }`).toCompiledIRBeEqual(/* ruby */`
        # --- Block main ---
        def main(): [ret 0B]
          a{0}: int*2B = alloca int2B
          i{0}: int*2B = alloca int2B
          *(i{0}: int*2B) = store %0: int2B
          t{0}: int2B = load i{0}: int*2B
          t{1}: int2B = t{0}: int2B PLUS %1: int2B
          *(i{0}: int*2B) = store t{1}: int2B
          *(a{0}: int*2B) = store t{0}: int2B
          ret
      `);
    });

    test('Assign post increment and pre increment: int a = i++ + ++i', () => {
      expect(/* cpp */ `void main() { int a, i = 0; a = i++ + ++i; }`).toCompiledIRBeEqual(/* ruby */`
        # --- Block main ---
        def main(): [ret 0B]
          a{0}: int*2B = alloca int2B
          i{0}: int*2B = alloca int2B
          *(i{0}: int*2B) = store %0: int2B
          t{0}: int2B = load i{0}: int*2B
          t{1}: int2B = t{0}: int2B PLUS %1: int2B
          *(i{0}: int*2B) = store t{1}: int2B
          t{2}: int2B = load i{0}: int*2B
          t{3}: int2B = t{2}: int2B PLUS %1: int2B
          *(i{0}: int*2B) = store t{3}: int2B
          t{4}: int2B = t{0}: int2B PLUS t{3}: int2B
          *(a{0}: int*2B) = store t{4}: int2B
          ret
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
      `).toCompiledIRBeEqual(/* ruby */`
        # --- Block main ---
        def main(): [ret 0B]
          arr{0}: int[3]*2B = alloca int[3]6B
          *(arr{0}: int[3]*2B) = store %1: int2B
          *(arr{0}: int[3]*2B + %2) = store %2: int2B
          *(arr{0}: int[3]*2B + %4) = store %3: int2B
          ptr{0}: int**2B = alloca int*2B
          t{0}: int[3]*2B = lea arr{0}: int[3]*2B
          *(ptr{0}: int**2B) = store t{0}: int[3]*2B
          ret
      `);
    });

    test('assignment realocated array to pointer', () => {
      expect(/* cpp */ `
          void main() {
            int arr[] = { 1, 2, 3, 4, 5, 6 };
            int* ptr = arr;
          }
      `).toCompiledIRBeEqual(/* ruby */`
        # --- Block main ---
        def main(): [ret 0B]
          arr{0}: int**2B = alloca int*2B
          t{0}: int*2B = lea c{0}: int[6]12B
          *(arr{0}: int**2B) = store t{0}: int*2B
          ptr{0}: int**2B = alloca int*2B
          t{1}: int*2B = load arr{0}: int**2B
          *(ptr{0}: int**2B) = store t{1}: int*2B
          ret

        # --- Block Data ---
          c{0}: int[6]12B = const { 1, 2, 3, 4, 5, 6 }
      `);
    });

    test('assignment 1-dimension array', () => {
      expect(/* cpp */ `
        void main() {
          int array[] = { 1, 2 };
          int sum = array[1] + 3 * 4;
        }
      `).toCompiledIRBeEqual(/* ruby */`
        # --- Block main ---
        def main(): [ret 0B]
          array{0}: int[2]*2B = alloca int[2]4B
          *(array{0}: int[2]*2B) = store %1: int2B
          *(array{0}: int[2]*2B + %2) = store %2: int2B
          sum{0}: int*2B = alloca int2B
          t{0}: int*2B = lea array{0}: int[2]*2B
          t{1}: int*2B = t{0}: int*2B PLUS %2: int2B
          t{2}: int2B = load t{1}: int*2B
          t{4}: int2B = t{2}: int2B PLUS %12: int2B
          *(sum{0}: int*2B) = store t{4}: int2B
          ret
      `);
    });

    test('assignment 1-dimension realocated array', () => {
      expect(/* cpp */ `
        void main() {
          int array[] = { 1, 2, 3, 4, 5 };
          int sum = array[1] - 3 * 4;
        }
      `).toCompiledIRBeEqual(/* ruby */`
        # --- Block main ---
        def main(): [ret 0B]
          array{0}: int**2B = alloca int*2B
          t{0}: int*2B = lea c{0}: int[5]10B
          *(array{0}: int**2B) = store t{0}: int*2B
          sum{0}: int*2B = alloca int2B
          t{1}: int*2B = load array{0}: int**2B
          t{2}: int*2B = t{1}: int*2B PLUS %2: int2B
          t{3}: int2B = load t{2}: int*2B
          t{5}: int2B = t{3}: int2B MINUS %12: int2B
          *(sum{0}: int*2B) = store t{5}: int2B
          ret

        # --- Block Data ---
          c{0}: int[5]10B = const { 1, 2, 3, 4, 5 }
      `);
    });

    test('assignment 2-dimension array by single dimension with realocated array', () => {
      expect(/* cpp */ `
        void main() {
          int array[4][3] = { 1, 2, 3, 4, 5 };
          int sum = array[1] + 3 * 4;
        }
      `).toCompiledIRBeEqual(/* ruby */`
        # --- Block main ---
        def main(): [ret 0B]
          array{0}: int**2B = alloca int*2B
          t{0}: int*2B = lea c{0}: int[12]24B
          *(array{0}: int**2B) = store t{0}: int*2B
          sum{0}: int*2B = alloca int2B
          t{1}: int*2B = load array{0}: int**2B
          t{2}: int*2B = t{1}: int*2B PLUS %6: int2B
          t{3}: int2B = load t{2}: int*2B
          t{5}: int2B = t{3}: int2B PLUS %12: int2B
          *(sum{0}: int*2B) = store t{5}: int2B
          ret

        # --- Block Data ---
          c{0}: int[12]24B = const { 1, 2, 3, 4, 5, null, null, null, null, null, null, null }
      `);
    });

    test('assignment 2-dimension array with realocated array', () => {
      expect(/* cpp */ `
        void main() {
          int array[4][3] = { 1, 2, 3, 4, 5 };
          int sum = array[1][0] + 3 * 4;
        }
      `).toCompiledIRBeEqual(/* ruby */`
        # --- Block main ---
        def main(): [ret 0B]
          array{0}: int**2B = alloca int*2B
          t{0}: int*2B = lea c{0}: int[12]24B
          *(array{0}: int**2B) = store t{0}: int*2B
          sum{0}: int*2B = alloca int2B
          t{1}: int*2B = load array{0}: int**2B
          t{2}: int*2B = t{1}: int*2B PLUS %6: int2B
          t{3}: int2B = load t{2}: int*2B
          t{5}: int2B = t{3}: int2B PLUS %12: int2B
          *(sum{0}: int*2B) = store t{5}: int2B
          ret

        # --- Block Data ---
          c{0}: int[12]24B = const { 1, 2, 3, 4, 5, null, null, null, null, null, null, null }
      `);
    });

    test('assignment 1-dimension array with structures', () => {
      expect(/* cpp */ `
        void main() {
          struct Vec2 { int x, y; } vec[] = { { .y = 4 }, { .x =  5 }};
          int sum = vec[1].x + vec[0].y;
        }
      `).toCompiledIRBeEqual(/* ruby */`
        # --- Block main ---
        def main(): [ret 0B]
          vec{0}: struct Vec2[2]*2B = alloca struct Vec2[2]8B
          *(vec{0}: struct Vec2[2]*2B + %2) = store %4: int2B
          *(vec{0}: struct Vec2[2]*2B + %4) = store %5: int2B
          sum{0}: int*2B = alloca int2B
          t{0}: int*2B = lea vec{0}: struct Vec2[2]*2B
          t{1}: int*2B = t{0}: int*2B PLUS %4: int2B
          t{2}: int2B = load t{1}: int*2B
          t{3}: int*2B = lea vec{0}: struct Vec2[2]*2B
          t{4}: int*2B = t{3}: int*2B PLUS %2: int2B
          t{5}: int2B = load t{4}: int*2B
          t{6}: int2B = t{2}: int2B PLUS t{5}: int2B
          *(sum{0}: int*2B) = store t{6}: int2B
          ret
      `);
    });

    test('assignment legacy way *(array + 1) = 1 with realocated array', () => {
      expect(/* cpp */ `
        void main() {
          int testArray[] = { 1, 2, 3, 4, 5 };
          *(1 + testArray + (2 * 3)) = 4;
        }
      `).toCompiledIRBeEqual(/* ruby */`
        # --- Block main ---
        def main(): [ret 0B]
          testArray{0}: int**2B = alloca int*2B
          t{0}: int*2B = lea c{0}: int[5]10B
          *(testArray{0}: int**2B) = store t{0}: int*2B
          t{1}: int*2B = load testArray{0}: int**2B
          t{6}: int*2B = t{1}: int*2B PLUS %14: int2B
          *(t{6}: int*2B) = store %4: int2B
          ret

        # --- Block Data ---
          c{0}: int[5]10B = const { 1, 2, 3, 4, 5 }
      `);
    });

    test('assignment legacy way *(array + 1) = 1 without realocated array', () => {
      expect(/* cpp */ `
        void main() {
          int testArray[] = { 1, 2, 3 };
          *(1 + testArray + (2 * 3)) = 4;
        }
      `).toCompiledIRBeEqual(/* ruby */`
        # --- Block main ---
        def main(): [ret 0B]
          testArray{0}: int[3]*2B = alloca int[3]6B
          *(testArray{0}: int[3]*2B) = store %1: int2B
          *(testArray{0}: int[3]*2B + %2) = store %2: int2B
          *(testArray{0}: int[3]*2B + %4) = store %3: int2B
          t{0}: int[3]*2B = lea testArray{0}: int[3]*2B
          t{5}: int[3]*2B = t{0}: int[3]*2B PLUS %14: int2B
          *(t{5}: int[3]*2B) = store %4: int2B
          ret
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
      `).toCompiledIRBeEqual(/* ruby */`
        # --- Block main ---
        def main(): [ret 0B]
          b{0}: int*2B = alloca int2B
          *(b{0}: int*2B) = store %4: int2B
          a{0}: int**2B = alloca int*2B
          t{0}: int*2B = lea b{0}: int*2B
          *(a{0}: int**2B) = store t{0}: int*2B
          ret
      `);
    });

    test('assign value to pointing value', () => {
      expect(/* cpp */ `
        void main() {
          int b = 4;
          int* a = &b;
          (*a) = 5;
        }
      `).toCompiledIRBeEqual(/* ruby */`
        # --- Block main ---
        def main(): [ret 0B]
          b{0}: int*2B = alloca int2B
          *(b{0}: int*2B) = store %4: int2B
          a{0}: int**2B = alloca int*2B
          t{0}: int*2B = lea b{0}: int*2B
          *(a{0}: int**2B) = store t{0}: int*2B
          t{1}: int*2B = load a{0}: int**2B
          *(t{1}: int*2B) = store %5: int2B
          ret
      `);
    });

    test('addition pointer + 4 should mul constant', () => {
      expect(/* cpp */ `
        void main() {
          int b = 4;
          int* a = &b;
          int c = a + 5;
        }
      `).toCompiledIRBeEqual(/* ruby */`
        # --- Block main ---
        def main(): [ret 0B]
          b{0}: int*2B = alloca int2B
          *(b{0}: int*2B) = store %4: int2B
          a{0}: int**2B = alloca int*2B
          t{0}: int*2B = lea b{0}: int*2B
          *(a{0}: int**2B) = store t{0}: int*2B
          c{0}: int*2B = alloca int2B
          t{1}: int*2B = load a{0}: int**2B
          t{3}: int*2B = t{1}: int*2B PLUS %10: int2B
          *(c{0}: int*2B) = store t{3}: int*2B
          ret
      `);
    });

    test('addition *pointer + 4 should not mul constant', () => {
      expect(/* cpp */ `
        void main() {
          int b = 4;
          int* a = &b;
          int c = *a + 5;
        }
      `).toCompiledIRBeEqual(/* ruby */`
        # --- Block main ---
        def main(): [ret 0B]
          b{0}: int*2B = alloca int2B
          *(b{0}: int*2B) = store %4: int2B
          a{0}: int**2B = alloca int*2B
          t{0}: int*2B = lea b{0}: int*2B
          *(a{0}: int**2B) = store t{0}: int*2B
          c{0}: int*2B = alloca int2B
          t{1}: int*2B = load a{0}: int**2B
          t{2}: int2B = load t{1}: int*2B
          t{3}: int2B = t{2}: int2B PLUS %5: int2B
          *(c{0}: int*2B) = store t{3}: int2B
          ret
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
      `).toCompiledIRBeEqual(/* ruby */`
        # --- Block main ---
        def main(): [ret 0B]
          vec{0}: struct Vec2*2B = alloca struct Vec24B
          *(vec{0}: struct Vec2*2B + %2) = store %5: int2B
          t{0}: int*2B = lea vec{0}: struct Vec2*2B
          t{1}: int*2B = t{0}: int*2B PLUS %2: int2B
          *(t{1}: int*2B) = store %7: int2B
          ret
      `);
    });

    test('assign nested values', () => {
      expect(/* cpp */`
        void main() {
          struct Vec2 { int x, y; struct Rect { int s, w; } k; } vec = { .y = 5 };
          vec.y = 7;
          vec.k.w = 2;
        }
      `).toCompiledIRBeEqual(/* ruby */`
        # --- Block main ---
        def main(): [ret 0B]
          vec{0}: struct Vec2*2B = alloca struct Vec28B
          *(vec{0}: struct Vec2*2B + %2) = store %5: int2B
          t{0}: int*2B = lea vec{0}: struct Vec2*2B
          t{1}: int*2B = t{0}: int*2B PLUS %2: int2B
          *(t{1}: int*2B) = store %7: int2B
          t{2}: int*2B = lea vec{0}: struct Vec2*2B
          t{4}: int*2B = t{2}: int*2B PLUS %6: int2B
          *(t{4}: int*2B) = store %2: int2B
          ret
      `);
    });

    test('pointer assign field access', () => {
      expect(/* cpp */`
        struct Vec2 { int x, y; };

        void main() {
          struct Vec2 vec = { .y = 5 };
          struct Vec2* ptr = &vec;
          ptr->y = 5;
        }
      `).toCompiledIRBeEqual(/* ruby */`
        # --- Block main ---
        def main(): [ret 0B]
          vec{0}: struct Vec2*2B = alloca struct Vec24B
          *(vec{0}: struct Vec2*2B + %2) = store %5: int2B
          ptr{0}: struct Vec2**2B = alloca struct Vec2*2B
          t{0}: int*2B = lea vec{0}: struct Vec2*2B
          *(ptr{0}: struct Vec2**2B) = store t{0}: int*2B
          t{1}: int*2B = load ptr{0}: struct Vec2**2B
          t{2}: int*2B = t{1}: int*2B PLUS %2: int2B
          *(t{2}: int*2B) = store %5: int2B
          ret
      `);
    });

    test('loads pointer field data', () => {
      expect(/* cpp */`
        struct Vec2 { int x, y; };

        void main() {
          struct Vec2 vec = { .y = 5 };
          struct Vec2* ptr = &vec;
          ptr->y = 5;

          int d = ptr->y;
        }
      `).toCompiledIRBeEqual(/* ruby */`
        # --- Block main ---
        def main(): [ret 0B]
          vec{0}: struct Vec2*2B = alloca struct Vec24B
          *(vec{0}: struct Vec2*2B + %2) = store %5: int2B
          ptr{0}: struct Vec2**2B = alloca struct Vec2*2B
          t{0}: int*2B = lea vec{0}: struct Vec2*2B
          *(ptr{0}: struct Vec2**2B) = store t{0}: int*2B
          t{1}: int*2B = load ptr{0}: struct Vec2**2B
          t{2}: int*2B = t{1}: int*2B PLUS %2: int2B
          *(t{2}: int*2B) = store %5: int2B
          d{0}: int*2B = alloca int2B
          t{3}: int*2B = load ptr{0}: struct Vec2**2B
          t{4}: int*2B = t{3}: int*2B PLUS %2: int2B
          t{5}: int2B = load t{4}: int*2B
          *(d{0}: int*2B) = store t{5}: int2B
          ret
      `);
    });

    test('loads pointer to array of structs', () => {
      expect(/* cpp */`
        struct Vec2 {
          int x, y;
          struct Rect { int s, w; } k;
        };

        void main() {
          struct Vec2 vec[] = { { .y = 5 }, { .x = 2 } };
          struct Vec2 (*ptr)[] = &vec;
        }
      `).toCompiledIRBeEqual(/* ruby */`
        # --- Block main ---
        def main(): [ret 0B]
          vec{0}: struct Vec2[2]*2B = alloca struct Vec2[2]16B
          *(vec{0}: struct Vec2[2]*2B + %2) = store %5: int2B
          *(vec{0}: struct Vec2[2]*2B + %8) = store %2: int2B
          ptr{0}: struct Vec2[]**2B = alloca struct Vec2[]*2B
          t{0}: int*2B = lea vec{0}: struct Vec2[2]*2B
          *(ptr{0}: struct Vec2[]**2B) = store t{0}: int*2B
          ret
      `);
    });
  });
});
