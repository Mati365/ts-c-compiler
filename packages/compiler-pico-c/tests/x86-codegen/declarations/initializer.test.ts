import '../utils';

describe('Variables initialization', () => {
  describe('Initialization with provided values', () => {
    test('basic initializer', () => {
      expect(/* cpp */ `
        void main() {
          int a = 4;
          char b = 'a';
          int c = 2;
        }
      `).toCompiledAsmBeEqual(`
        cpu 386
        ; def main():
        @@_fn_main:
        push bp
        mov bp, sp
        mov word [bp - 2], 4      ; *(a{0}: int*2B) = store %4: int2B
        mov byte [bp - 3], 97     ; *(b{0}: char*2B) = store %97: char1B
        mov word [bp - 5], 2      ; *(c{0}: int*2B) = store %2: int2B
        pop bp
        ret
      `);
    });

    test('struct array initializer', () => {
      expect(/* cpp */ `
        void main() {
          struct Vec2 { int x, y; } vecs[] = { { .x = 1, .y = 2 }, { .y = 4 }};
        }
      `).toCompiledAsmBeEqual(`
        cpu 386
        ; def main():
        @@_fn_main:
        push bp
        mov bp, sp
        mov word [bp - 8], 1      ; *(vecs{0}: struct Vec2[2]*2B) = store %1: int2B
        mov word [bp - 6], 2      ; *(vecs{0}: struct Vec2[2]*2B + %2) = store %2: int2B
        mov word [bp - 2], 4      ; *(vecs{0}: struct Vec2[2]*2B + %6) = store %4: int2B
        pop bp
        ret
      `);
    });
  });

  describe('Missing initialization value', () => {
    test('second variable has proper stack offset if first is not initialized', () => {
      expect(/* cpp */ `
        void main() {
          int a;
          int b = 4;
        }
      `).toCompiledAsmBeEqual(`
        cpu 386
        ; def main():
        @@_fn_main:
        push bp
        mov bp, sp
        mov word [bp - 4], 4      ; *(b{0}: int*2B) = store %4: int2B
        pop bp
        ret
      `);
    });

    test('multiple variable initialization results in proper offset', () => {
      expect(/* cpp */ `
        void main() {
          int a, b, c[2];
          int d = 4;
        }
      `).toCompiledAsmBeEqual(`
        cpu 386
        ; def main():
        @@_fn_main:
        push bp
        mov bp, sp
        mov word [bp - 10], 4     ; *(d{0}: int*2B) = store %4: int2B
        pop bp
        ret
      `);
    });
  });

  describe('Initialization with implicit casting', () => {
    test('int b = letters[0] + 2', () => {
      expect(/* cpp */ `
        void main() {
          char letters[] = "He";
          int a = letters[0] + 2;
        }
      `).toCompiledAsmBeEqual(`
        cpu 386
        ; def main():
        @@_fn_main:
        push bp
        mov bp, sp
        mov word [bp - 2], 25928  ; *(letters{0}: int*2B) = store %25928: int2B
        lea bx, [bp - 2]          ; %t{0}: char*2B = lea letters{0}: char[2]*2B
        mov al, [bx]              ; %t{1}: char1B = load %t{0}: char*2B
        add al, 2                 ; %t{2}: char1B = %t{1}: char1B plus %2: char1B
        movzx cx, al
        mov word [bp - 4], cx     ; *(a{0}: int*2B) = store %t{2}: char1B
        pop bp
        ret
      `);
    });
  });

  describe('Initialization with explicit casting', () => {
    test('int a = (int) b + 3 + (int) b;', () => {
      expect(/* cpp */ `
        void main() {
          char b = 's';
          int a = (int) b + 3 + (int) b;
        }
      `).toCompiledAsmBeEqual(`
        cpu 386
        ; def main():
        @@_fn_main:
        push bp
        mov bp, sp
        mov byte [bp - 1], 115    ; *(b{0}: char*2B) = store %115: char1B
        mov al, [bp - 1]
        add al, 3                 ; %t{1}: char1B = %t{0}: char1B plus %3: char1B
        add al, byte [bp - 1]     ; %t{3}: char1B = %t{1}: char1B plus %t{2}: char1B
        movzx bx, al
        mov word [bp - 3], bx     ; *(a{0}: int*2B) = store %t{3}: char1B
        pop bp
        ret
      `);
    });

    test('int a = (int) b + 3 + (int) b + k;', () => {
      expect(/* cpp */ `
        void main() {
          char b = 's';
          int k = 1231;
          int a = (int) b + 3 + (int) b + k;
        }
      `).toCompiledAsmBeEqual(`
          cpu 386
          ; def main():
          @@_fn_main:
          push bp
          mov bp, sp
          mov byte [bp - 1], 115    ; *(b{0}: char*2B) = store %115: char1B
          mov word [bp - 3], 1231   ; *(k{0}: int*2B) = store %1231: int2B
          mov al, [bp - 1]
          add al, 3                 ; %t{1}: char1B = %t{0}: char1B plus %3: char1B
          add al, byte [bp - 1]     ; %t{3}: char1B = %t{1}: char1B plus %t{2}: char1B
          movzx bx, al
          add bx, word [bp - 3]     ; %t{5}: int2B = %t{3}: char1B plus %t{4}: int2B
          mov word [bp - 5], bx     ; *(a{0}: int*2B) = store %t{5}: int2B
          pop bp
          ret
      `);
    });
  });

  describe('Array initialization', () => {
    test('int[]', () => {
      expect(/* cpp */ `
        void main() {
          int arr[] = { 1 };
          int arr2[] = { 1, 2, 3, 4, 5 };
        }
      `).toCompiledAsmBeEqual(`
        cpu 386
        ; def main():
        @@_fn_main:
        push bp
        mov bp, sp
        mov word [bp - 2], 1      ; *(arr{0}: int[1]*2B) = store %1: int2B
        mov word [bp - 12], 1     ; *(arr2{0}: int[5]*2B) = store %1: int2B
        mov word [bp - 10], 2     ; *(arr2{0}: int[5]*2B + %2) = store %2: int2B
        mov word [bp - 8], 3      ; *(arr2{0}: int[5]*2B + %4) = store %3: int2B
        mov word [bp - 6], 4      ; *(arr2{0}: int[5]*2B + %6) = store %4: int2B
        mov word [bp - 4], 5      ; *(arr2{0}: int[5]*2B + %8) = store %5: int2B
        pop bp
        ret
      `);
    });

    test('const int[]', () => {
      expect(/* cpp */ `
        void main() {
          const int arr[] = { 1 };
          const int arr2[] = { 1, 2, 3, 4, 5 };
          const int arr3[] = { 1, 2 };
        }
      `).toCompiledAsmBeEqual(`
        cpu 386
        ; def main():
        @@_fn_main:
        push bp
        mov bp, sp
        mov word [bp - 2], 1      ; *(arr{0}: const int[1]*2B) = store %1: const int2B
        mov bx, @@_c_0_           ; %t{0}: const int*2B = lea c{0}: const int[5]10B
        mov word [bp - 4], bx     ; *(arr2{0}: const int**2B) = store %t{0}: const int*2B
        mov word [bp - 8], 1      ; *(arr3{0}: const int[2]*2B) = store %1: const int2B
        mov word [bp - 6], 2      ; *(arr3{0}: const int[2]*2B + %2) = store %2: const int2B
        pop bp
        ret

        @@_c_0_: db 1, 2, 3, 4, 5
      `);
    });

    test('struct array', () => {
      expect(/* cpp */ `
        void main() {
          struct Vec2 { int x, y; char z; } vec[] = { { .y = 4 }, { .x =  5, .z = 7 }};
        }
      `).toCompiledAsmBeEqual(`
        cpu 386
        ; def main():
        @@_fn_main:
        push bp
        mov bp, sp
        mov word [bp - 8], 4      ; *(vec{0}: struct Vec2[2]*2B + %2) = store %4: int2B
        mov word [bp - 5], 5      ; *(vec{0}: struct Vec2[2]*2B + %5) = store %5: int2B
        mov byte [bp - 1], 7      ; *(vec{0}: struct Vec2[2]*2B + %9) = store %7: char1B
        pop bp
        ret
      `);
    });
  });

  describe('Strings initialization', () => {
    test('const char* letters1 = "H";', () => {
      expect(/* cpp */ `
        void main() {
          const char* letters1 = "H";
        }
      `).toCompiledAsmBeEqual(`
        cpu 386
        ; def main():
        @@_fn_main:
        push bp
        mov bp, sp
        mov word [bp - 2], 72     ; *(letters1{0}: const char**2B) = store %72: const char*2B
        pop bp
        ret
      `);
    });

    test('const char* letters = "Hell";', () => {
      expect(/* cpp */ `
        void main() {
          const char* letters1 = "Hell";
          char* letters2 = "Hello";
          const char* letters3 = "Hello world";
        }
      `).toCompiledAsmBeEqual(`
        cpu 386
        ; def main():
        @@_fn_main:
        push bp
        mov bp, sp
        mov bx, @@_c_0_           ; %t{0}: const char*2B = lea c{0}: const char[4]4B
        mov word [bp - 2], bx     ; *(letters1{0}: const char**2B) = store %t{0}: const char*2B
        mov di, @@_c_1_           ; %t{1}: char*2B = lea c{1}: char[5]5B
        mov word [bp - 4], di     ; *(letters2{0}: char**2B) = store %t{1}: char*2B
        mov si, @@_c_2_           ; %t{2}: const char*2B = lea c{2}: const char[11]11B
        mov word [bp - 6], si     ; *(letters3{0}: const char**2B) = store %t{2}: const char*2B
        pop bp
        ret

        @@_c_0_: db 72, 101, 108, 108
        @@_c_1_: db 72, 101, 108, 108, 111
        @@_c_2_: db 72, 101, 108, 108, 111, 32, 119, 111, 114, 108, 100
      `);
    });

    test('char letters1[] = "Hell";', () => {
      expect(/* cpp */ `
        void main() {
          char letters1[] = "Hell";
          const char letters2[] = "Hello!";
        }
      `).toCompiledAsmBeEqual(`
        cpu 386
        ; def main():
        @@_fn_main:
        push bp
        mov bp, sp
        mov word [bp - 4], 25928  ; *(letters1{0}: int*2B) = store %25928: int2B
        mov word [bp - 2], 27756  ; *(letters1{0}: int*2B + %2) = store %27756: int2B
        mov bx, @@_c_0_           ; %t{0}: const char*2B = lea c{0}: const char[6]6B
        mov word [bp - 6], bx     ; *(letters2{0}: const char**2B) = store %t{0}: const char*2B
        pop bp
        ret

        @@_c_0_: db 72, 101, 108, 108, 111, 33
      `);
    });
  });
});
