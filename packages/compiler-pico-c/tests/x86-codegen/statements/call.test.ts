import '../utils';

describe('Function call', () => {
  describe('Primitive types', () => {
    test('call void function', () => {
      expect(/* cpp */ `
        void test() {
          int k = 2;
        }
        void main() {
          int a = 4;
          int ks = a + 7;
          test();
          int k = a + 10;
        }
      `).toCompiledAsmBeEqual(`
        cpu 386
        ; def test():
        @@_fn_test:
        push bp
        mov bp, sp
        mov word [bp - 2], 2      ; *(k{0}: int*2B) = store %2: int2B
        pop bp
        ret

        ; def main():
        @@_fn_main:
        push bp
        mov bp, sp
        mov word [bp - 2], 4      ; *(a{0}: int*2B) = store %4: int2B
        mov ax, [bp - 2]
        add ax, 7                 ; %t{1}: int2B = %t{0}: int2B plus %7: char1B
        mov word [bp - 4], ax     ; *(ks{0}: int*2B) = store %t{1}: int2B
        call @@_fn_test
        mov bx, [bp - 2]
        add bx, 10                ; %t{4}: int2B = %t{3}: int2B plus %10: char1B
        mov word [bp - 6], bx     ; *(k{1}: int*2B) = store %t{4}: int2B
        pop bp
        ret
      `);
    });

    test('cleanup extra arguments passed to function', () => {
      expect(/* cpp */ `
        void test() {}
        void main() {
          test(3, 4, 5);
        }
      `).toCompiledAsmBeEqual(`
        cpu 386
        ; def test():
        @@_fn_test:
        push bp
        mov bp, sp
        pop bp
        ret

        ; def main():
        @@_fn_main:
        push bp
        mov bp, sp
        push 5
        push 4
        push 3
        call @@_fn_test
        add sp, 6
        pop bp
        ret
      `);
    });

    test('returned value from void type is not present', () => {
      expect(/* cpp */ `
        void test() {
          return 2;
        }
        void main() {
          int k = 2;
          return k;
        }
      `).toCompiledAsmBeEqual(`
        cpu 386
        ; def test():
        @@_fn_test:
        push bp
        mov bp, sp
        pop bp
        ret

        ; def main():
        @@_fn_main:
        push bp
        mov bp, sp
        mov word [bp - 2], 2      ; *(k{0}: int*2B) = store %2: int2B
        pop bp
        ret
      `);
    });

    test('return value is stored in reg', () => {
      expect(/* cpp */ `
        int sum(int a, int b) { return a + b; }
        int main() { int acc = sum(1, 2) + 4; }
      `).toCompiledAsmBeEqual(`
        cpu 386
        ; def sum(a{0}: int*2B, b{0}: int*2B): [ret: int2B]
        @@_fn_sum:
        push bp
        mov bp, sp
        mov ax, [bp + 2]
        add ax, word [bp + 4]     ; %t{2}: int2B = %t{0}: int2B plus %t{1}: int2B
        pop bp
        ret 4

        ; def main(): [ret: int2B]
        @@_fn_main:
        push bp
        mov bp, sp
        push 2
        push 1
        call @@_fn_sum
        add ax, 4                 ; %t{5}: int2B = %t{4}: int2B plus %4: char1B
        mov word [bp - 2], ax     ; *(acc{0}: int*2B) = store %t{5}: int2B
        pop bp
        ; missing return
        ret
      `);
    });

    test('call with mixed args type Int and Char', () => {
      expect(/* cpp */ `
        int sum(int a, char b) { return a + b; }
        void main() { int k = sum(3, 'a'); }
      `).toCompiledAsmBeEqual(`
        cpu 386
        ; def sum(a{0}: int*2B, b{0}: char*2B): [ret: int2B]
        @@_fn_sum:
        push bp
        mov bp, sp
        mov ax, [bp + 2]
        mov bx, word [bp + 4]
        and bx, 0xff
        add ax, bx                ; %t{2}: int2B = %t{0}: int2B plus %t{1}: char1B
        pop bp
        ret 4

        ; def main():
        @@_fn_main:
        push bp
        mov bp, sp
        push 97
        push 3
        call @@_fn_sum
        mov word [bp - 2], ax     ; *(k{0}: int*2B) = store %t{4}: int2B
        pop bp
        ret
      `);
    });
  });

  describe('Array types', () => {
    test('call with string literal', () => {
      expect(/* cpp */ `
        void printf(const char* str) {}
        int main() {
          printf("Hello");
        }
      `).toCompiledAsmBeEqual(`
        cpu 386
        ; def printf(str{0}: const char**2B):
        @@_fn_printf:
        push bp
        mov bp, sp
        pop bp
        ret 2

        ; def main(): [ret: int2B]
        @@_fn_main:
        push bp
        mov bp, sp
        mov bx, @@_c_0_           ; %t{2}: const char*2B = lea c{0}: const char[5]5B
        mov word [bp - 2], bx     ; *(%t{1}: const char**2B) = store %t{2}: const char*2B
        push word [bp - 2]
        call @@_fn_printf
        pop bp
        ; missing return
        ret

        @@_c_0_: db 72, 101, 108, 108, 111
      `);
    });

    test('call with two string literals, one implicit', () => {
      expect(/* cpp */ `
        void printf(const char* str, const char* str2) {}
        int main() {
          const char* str = "Hello world!";
          printf("Hello", str);
        }
      `).toCompiledAsmBeEqual(`
        cpu 386
        ; def printf(str{0}: const char**2B, str2{0}: const char**2B):
        @@_fn_printf:
        push bp
        mov bp, sp
        pop bp
        ret 4

        ; def main(): [ret: int2B]
        @@_fn_main:
        push bp
        mov bp, sp
        mov bx, @@_c_0_           ; %t{0}: const char*2B = lea c{0}: const char[12]12B
        mov word [bp - 2], bx     ; *(str{1}: const char**2B) = store %t{0}: const char*2B
        mov di, @@_c_1_           ; %t{3}: const char*2B = lea c{1}: const char[5]5B
        mov word [bp - 4], di     ; *(%t{2}: const char**2B) = store %t{3}: const char*2B
        mov si, [bp - 2]          ; %t{4}: const char*2B = load str{1}: const char**2B
        push si
        push word [bp - 4]
        call @@_fn_printf
        pop bp
        ; missing return
        ret

        @@_c_0_: db 72, 101, 108, 108, 111, 32, 119, 111, 114, 108, 100, 33
        @@_c_1_: db 72, 101, 108, 108, 111
      `);
    });
  });

  describe('Struct types', () => {
    test('call with struct as argument', () => {
      expect(/* cpp */ `
        struct Vec2 { int x, y; };
        int sum_vec(struct Vec2 vec) { return vec.x + vec.y; }
        int main() {
          struct Vec2 vec = { .x = 1, .y = 3 };
          sum_vec(vec);
        }
      `).toCompiledAsmBeEqual(`
      `);
    });
  });
});
