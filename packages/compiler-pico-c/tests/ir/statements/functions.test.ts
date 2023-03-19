import '../utils';

describe('Functions IR', () => {
  test('should emit return by register from expression primitive types', () => {
    expect(/* cpp */ `
      int sum(int x, int y) { return x + y; }
      void main() { sum(1, 2); }
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
        %t{4}: int2B = call label-offset sum :: (%1: char1B, %2: char1B)
        ret
        end-def
    `);
  });

  test('should emit local primitive variable', () => {
    expect(/* cpp */ `
      int sum(int x, int y) {
        int d = x + y;
        return d;
      }
      void main() { sum(1, 2); }
    `).toCompiledIRBeEqual(/* ruby */ `
      # --- Block sum ---
      def sum(x{0}: int*2B, y{0}: int*2B): [ret: int2B]
        d{0}: int*2B = alloca int2B
        %t{0}: int2B = load x{0}: int*2B
        %t{1}: int2B = load y{0}: int*2B
        %t{2}: int2B = %t{0}: int2B plus %t{1}: int2B
        *(d{0}: int*2B) = store %t{2}: int2B
        %t{3}: int2B = load d{0}: int*2B
        ret %t{3}: int2B
        end-def
        # --- Block main ---
        def main():
        %t{5}: int2B = call label-offset sum :: (%1: char1B, %2: char1B)
        ret
        end-def
    `);
  });

  test('should emit small structures using registers', () => {
    expect(/* cpp */ `
      struct Vec2 { int x; };
      struct Vec2 sum() {
        struct Vec2 out = { .x = 6 };
        return out;
      }
      void main() { sum(); }
    `).toCompiledIRBeEqual(/* ruby */ `
      # --- Block sum ---
      def sum(): [ret: struct Vec22B]
        out{0}: struct Vec2*2B = alloca struct Vec22B
        *(out{0}: struct Vec2*2B) = store %6: int2B
        %t{0}: struct Vec22B = load out{0}: struct Vec2*2B
        ret %t{0}: struct Vec22B
        end-def
        # --- Block main ---
        def main():
        %t{2}: struct Vec22B = call label-offset sum :: ()
        ret
        end-def
    `);
  });

  test('should return larger structures with RVO', () => {
    expect(/* cpp */ `
      struct Vec2 { int x, y; };
      struct Vec2 sum() {
        struct Vec2 out = { .x = 6 };
        return out;
      }
      void main() {
        sum();
      }
    `).toCompiledIRBeEqual(/* ruby */ `
      # --- Block sum ---
      def sum(rvo: %out{0}: struct Vec2*2B):
        out{0}: struct Vec2*2B = alloca struct Vec24B
        *(out{0}: struct Vec2*2B) = store %6: int2B
        ret out{0}: struct Vec2*2B
        end-def
        # --- Block main ---
        def main():
        %t{1}: struct Vec2*2B = alloca struct Vec24B
        %t{2}: struct Vec2*2B = lea %t{1}: struct Vec2*2B
        call label-offset sum :: (%t{2}: struct Vec2*2B)
        ret
        end-def
    `);
  });

  test('should be possible to call function in expressions', () => {
    expect(/* cpp */ `
      int sum(int x, int y) { return x + y; }
      void main() {
        int out = sum(1, 2) + 3;
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
        out{0}: int*2B = alloca int2B
        %t{4}: int2B = call label-offset sum :: (%1: char1B, %2: char1B)
        %t{5}: int2B = %t{4}: int2B plus %3: char1B
        *(out{0}: int*2B) = store %t{5}: int2B
        ret
        end-def
    `);
  });

  test('should be possible to call function expressions by ptr', () => {
    expect(/* cpp*/ `
      int sum(int x, int y) { return x + y; }
      int main() {
        int (*ptr)(int, int) = sum;
        (*ptr + 1)(1, 2);
        ptr(1, 2);
        (*ptr)(4, 5);
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
        def main(): [ret: int2B]
        ptr{0}: int(int, int)**2B = alloca int(int, int)*2B
        %t{3}: int sum(int, int)*2B = label-offset sum
        *(ptr{0}: int(int, int)**2B) = store %t{3}: int sum(int, int)*2B
        %t{4}: int(int, int)*2B = load ptr{0}: int(int, int)**2B
        %t{5}: int(int, int)*2B = %t{4}: int(int, int)*2B plus %1: char1B
        %t{6}: int2B = call %t{5}: int(int, int)*2B :: (%1: char1B, %2: char1B)
        %t{7}: int(int, int)*2B = load ptr{0}: int(int, int)**2B
        %t{8}: int2B = call %t{7}: int(int, int)*2B :: (%1: char1B, %2: char1B)
        %t{9}: int(int, int)*2B = load ptr{0}: int(int, int)**2B
        %t{10}: int2B = call %t{9}: int(int, int)*2B :: (%4: char1B, %5: char1B)
        ret
        end-def
    `);
  });

  test('should be possible to call function with RVO expressions by ptr', () => {
    expect(/* cpp*/ `
      struct Vec2 {
        int x, y;
      };

      struct Vec2 of_vec(int x, int y) {
        struct Vec2 v = { .x = x, .y = y };
        return v;
      }

      int main() {
        struct Vec2 (*ptr)(int, int) = of_vec;
        struct Vec2 vec = (*ptr + 1)(1, 2);
      }
    `).toCompiledIRBeEqual(/* ruby */ `
        # --- Block of_vec ---
        def of_vec(x{0}: int*2B, y{0}: int*2B, rvo: %out{0}: struct Vec2*2B):
        v{0}: struct Vec2*2B = alloca struct Vec24B
        %t{0}: int2B = load x{0}: int*2B
        *(v{0}: struct Vec2*2B) = store %t{0}: int2B
        %t{1}: int2B = load y{0}: int*2B
        *(v{0}: struct Vec2*2B + %2) = store %t{1}: int2B
        ret v{0}: struct Vec2*2B
        end-def
        # --- Block main ---
        def main(): [ret: int2B]
        ptr{0}: struct Vec2(int, int)**2B = alloca struct Vec2(int, int)*2B
        %t{2}: struct Vec2 of_vec(int, int)*2B = label-offset of_vec
        *(ptr{0}: struct Vec2(int, int)**2B) = store %t{2}: struct Vec2 of_vec(int, int)*2B
        vec{0}: struct Vec2*2B = alloca struct Vec24B
        %t{3}: struct Vec2(int, int)*2B = load ptr{0}: struct Vec2(int, int)**2B
        %t{4}: struct Vec2(int, int)*2B = %t{3}: struct Vec2(int, int)*2B plus %1: char1B
        %t{5}: struct Vec2**2B = lea vec{0}: struct Vec2*2B
        call %t{4}: struct Vec2(int, int)*2B :: (%1: char1B, %2: char1B, %t{5}: struct Vec2**2B)
        ret
        end-def
    `);
  });

  test('RVO should be applied to literal string arguments', () => {
    expect(/* cpp*/ `
      void print(const char* str) {}
      void main() {
        print("hello world!");
      }
    `).toCompiledIRBeEqual(/* ruby */ `
      # --- Block print ---
      def print(str{0}: const char**2B):
      ret
      end-def
      # --- Block main ---
      def main():
      %t{1}: const char**2B = alloca const char*2B
      %t{2}: const char*2B = lea c{0}: const char[13]*2B
      *(%t{1}: const char**2B) = store %t{2}: const char*2B
      call label-offset print :: (%t{1}: const char**2B)
      ret
      end-def
      # --- Block Data ---
      c{0}: const char[13]*2B = const { 104, 101, 108, 108, 111, 32, 119, 111, 114, 108, 100, 33, 0 }
    `);
  });

  test('should be possible to return value even with void function', () => {
    expect(/* cpp*/ `
      void main() {
        return 2 + 3;
      }
    `).toCompiledIRBeEqual(/* ruby */ `
      # --- Block main ---
      def main():
        ret
        end-def
    `);
  });

  test('should not return primitive variable from function with void return type', () => {
    expect(/* cpp*/ `
      void sum() {
        int k = 2;
        return k;
      }
    `).toCompiledIRBeEqual(/* ruby */ `
      # --- Block sum ---
      def sum():
        k{0}: int*2B = alloca int2B
        *(k{0}: int*2B) = store %2: int2B
        ret
        end-def
    `);
  });

  test('should not return constants from function with void return type', () => {
    expect(/* cpp*/ `
      void sum() {
        return 2;
      }
    `).toCompiledIRBeEqual(/* ruby */ `
      # --- Block sum ---
      def sum():
        ret
        end-def
    `);
  });

  test('call with string literal', () => {
    expect(/* cpp*/ `
      void printf(const char* str) {}
      int main() {
        printf("Hello");
      }
    `).toCompiledIRBeEqual(/* ruby */ `
      # --- Block printf ---
      def printf(str{0}: const char**2B):
        ret
        end-def
        # --- Block main ---
        def main(): [ret: int2B]
        %t{1}: const char**2B = alloca const char*2B
        %t{2}: const char*2B = lea c{0}: const char[6]*2B
        *(%t{1}: const char**2B) = store %t{2}: const char*2B
        call label-offset printf :: (%t{1}: const char**2B)
        ret
        end-def
        # --- Block Data ---
        c{0}: const char[6]*2B = const { 72, 101, 108, 108, 111, 0 }
    `);
  });

  test('call function with pointer to struct and increment', () => {
    expect(/* cpp*/ `
      struct Vec2 {
        int x, y;
      };

      void inc(struct Vec2* vec, int k) {
        vec->y += 3 + k;
        vec->y--;
      }

      int main() {
        int a = 1;
        struct Vec2 vec = { .x = 5, .y = 11 };
        inc(&vec, 10);

        a = vec.y;
        asm("xchg dx, dx");
        return a;
      }
    `).toCompiledIRBeEqual(/* ruby */ `
        # --- Block inc ---
        def inc(vec{0}: struct Vec2**2B, k{0}: int*2B):
        %t{0}: struct Vec2*2B = load vec{0}: struct Vec2**2B
        %t{1}: int*2B = %t{0}: struct Vec2*2B plus %2: int2B
        %t{2}: int2B = load k{0}: int*2B
        %t{3}: int2B = %t{2}: int2B plus %3: char1B
        %t{4}: int2B = load %t{1}: int*2B
        %t{5}: int2B = %t{4}: int2B plus %t{3}: int2B
        *(%t{1}: int*2B) = store %t{5}: int2B
        %t{7}: int*2B = %t{0}: struct Vec2*2B plus %2: int2B
        %t{8}: int2B = load %t{7}: int*2B
        %t{9}: int2B = %t{8}: int2B minus %1: int2B
        *(%t{7}: int*2B) = store %t{9}: int2B
        ret
        end-def
        # --- Block main ---
        def main(): [ret: int2B]
        a{0}: int*2B = alloca int2B
        *(a{0}: int*2B) = store %1: int2B
        vec{1}: struct Vec2*2B = alloca struct Vec24B
        *(vec{1}: struct Vec2*2B) = store %5: int2B
        *(vec{1}: struct Vec2*2B + %2) = store %11: int2B
        %t{11}: struct Vec2*2B = lea vec{1}: struct Vec2*2B
        call label-offset inc :: (%t{11}: struct Vec2*2B, %10: char1B)
        %t{12}: struct Vec2*2B = lea vec{1}: struct Vec2*2B
        %t{13}: int*2B = %t{12}: struct Vec2*2B plus %2: int2B
        %t{14}: int2B = load %t{13}: int*2B
        *(a{0}: int*2B) = store %t{14}: int2B
        asm "xchg dx, dx"
        %t{15}: int2B = load a{0}: int*2B
        ret %t{15}: int2B
        end-def
    `);
  });
});
