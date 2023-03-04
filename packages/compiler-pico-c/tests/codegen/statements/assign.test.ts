import '../utils';

describe('Variable assign', () => {
  describe('Assign to plain variable', () => {
    test('b += letters[0] * 2', () => {
      expect(/* cpp */ `
        void main() {
          char letters[] = "He";
          int a = 0;

          a += letters[0] * 2;
        }
      `).toCompiledAsmBeEqual(`
        cpu 386
        ; def main():
        @@_fn_main:
        push bp
        mov bp, sp
        sub sp, 5
        mov word [bp - 3], 25928  ; *(letters{0}: int*2B) = store %25928: int2B
        mov byte [bp - 1], 0      ; *(letters{0}: char[3]*2B + %2) = store %0: char1B
        mov word [bp - 5], 0      ; *(a{0}: int*2B) = store %0: int2B
        lea bx, [bp - 3]          ; %t{0}: char*2B = lea letters{0}: char[3]*2B
        mov al, [bx]              ; %t{1}: char1B = load %t{0}: char*2B
        movzx cx, al
        shl cx, 1                 ; %t{2}: char1B = %t{1}: char1B mul %2: char1B
        mov ax, [bp - 5]
        movzx dx, cx
        add ax, dx                ; %t{4}: int2B = %t{3}: int2B plus %t{2}: char1B
        mov word [bp - 5], ax     ; *(a{0}: int*2B) = store %t{4}: int2B
        mov sp, bp
        pop bp
        ret
      `);
    });

    test.skip('compiler reuses variable that is already placed in reg', () => {
      expect(/* cpp */ `
        void main() {
          int a = 2;
          a = a + 6;
          a = a + 5;
        }
      `).toCompiledAsmBeEqual(`
      `);
    });

    test('compiler does not reuse variable if branch is between statements', () => {
      expect(/* cpp */ `
        void sum() {}
        void main() {
          int a = 2;
          a = a + 6;
          sum();
          a = a + 5;
        }
      `).toCompiledAsmBeEqual(`
        cpu 386
        ; def sum():
        @@_fn_sum:
        push bp
        mov bp, sp
        sub sp, 0
        mov sp, bp
        pop bp
        ret
        ; def main():
        @@_fn_main:
        push bp
        mov bp, sp
        sub sp, 2
        mov word [bp - 2], 2      ; *(a{0}: int*2B) = store %2: int2B
        mov ax, [bp - 2]
        add ax, 6                 ; %t{1}: int2B = %t{0}: int2B plus %6: char1B
        mov word [bp - 2], ax     ; *(a{0}: int*2B) = store %t{1}: int2B
        call @@_fn_sum
        mov ax, [bp - 2]
        add ax, 5                 ; %t{4}: int2B = %t{3}: int2B plus %5: char1B
        mov word [bp - 2], ax     ; *(a{0}: int*2B) = store %t{4}: int2B
        mov sp, bp
        pop bp
        ret
      `);
    });

    test('assign struct members', () => {
      expect(/* cpp */ `
        struct Vec2 {
          int x, y;
        };

        void main() {
          struct Vec2 vec = { .x = 1, .y = 3 };
          int k = vec.x + vec.y;
        }
      `).toCompiledAsmBeEqual(`
        cpu 386
        ; def main():
        @@_fn_main:
        push bp
        mov bp, sp
        sub sp, 6
        mov word [bp - 4], 1      ; *(vec{0}: struct Vec2*2B) = store %1: int2B
        mov word [bp - 2], 3      ; *(vec{0}: struct Vec2*2B + %2) = store %3: int2B
        lea bx, [bp - 4]          ; %t{0}: struct Vec2*2B = lea vec{0}: struct Vec2*2B
        mov ax, [bx]              ; %t{1}: int2B = load %t{0}: struct Vec2*2B
        add bx, 2                 ; %t{3}: struct Vec2*2B = %t{0}: struct Vec2*2B plus %2: int2B
        mov cx, [bx]              ; %t{4}: int2B = load %t{3}: struct Vec2*2B
        add ax, cx                ; %t{5}: int2B = %t{1}: int2B plus %t{4}: int2B
        mov word [bp - 6], ax     ; *(k{0}: int*2B) = store %t{5}: int2B
        mov sp, bp
        pop bp
        ret
      `);
    });

    test('assign array struct members', () => {
      expect(/* cpp */ `
        void main() {
          struct Vec2 { int x, y; char z; } vec[] = { { .y = 4 }, { .x =  5, .z = 7 }};
          int sum = vec[0].z + vec[1].x;
        }
      `).toCompiledAsmBeEqual(`
        cpu 386
        ; def main():
        @@_fn_main:
        push bp
        mov bp, sp
        sub sp, 12
        mov word [bp - 8], 4      ; *(vec{0}: struct Vec2[2]*2B + %2) = store %4: int2B
        mov word [bp - 5], 5      ; *(vec{0}: struct Vec2[2]*2B + %5) = store %5: int2B
        mov byte [bp - 1], 7      ; *(vec{0}: struct Vec2[2]*2B + %9) = store %7: char1B
        lea bx, [bp - 10]         ; %t{0}: struct Vec2*2B = lea vec{0}: struct Vec2[2]*2B
        mov ax, bx                ; swap - %t{1}: struct Vec2*2B = %t{0}: struct Vec2*2B plus %4: int2B
        add bx, 4                 ; %t{1}: struct Vec2*2B = %t{0}: struct Vec2*2B plus %4: int2B
        mov al, [bx]              ; %t{2}: char1B = load %t{1}: struct Vec2*2B
        add ax, 5                 ; %t{4}: struct Vec2*2B = %t{0}: struct Vec2*2B plus %5: int2B
        mov di, ax
        mov ax, [di]              ; %t{5}: int2B = load %t{4}: struct Vec2*2B
        movzx cx, al
        add cx, ax                ; %t{6}: int2B = %t{2}: char1B plus %t{5}: int2B
        mov word [bp - 12], cx    ; *(sum{0}: int*2B) = store %t{6}: int2B
        mov sp, bp
        pop bp
        ret
      `);
    });

    test('assign to 2D array with only single index access', () => {
      expect(/* cpp */ `
        void main() {
          const int array[4][3] = { 1, 2, 3, 4, 5 };
          int sum = array[1] + 3 * 4;
        }
      `).toCompiledAsmBeEqual(`
        cpu 386
        ; def main():
        @@_fn_main:
        push bp
        mov bp, sp
        sub sp, 4
        mov bx, @@_c_0_           ; %t{0}: const int*2B = lea c{0}: const int[12]24B
        mov word [bp - 2], bx     ; *(array{0}: const int**2B) = store %t{0}: const int*2B
        mov di, [bp - 2]          ; %t{1}: const int*2B = load array{0}: const int**2B
        add di, 6                 ; %t{2}: const int*2B = %t{1}: const int*2B plus %6: int2B
        mov ax, [di]              ; %t{3}: const int2B = load %t{2}: const int*2B
        add ax, 12                ; %t{5}: const int2B = %t{3}: const int2B plus %12: char1B
        mov word [bp - 4], ax     ; *(sum{0}: int*2B) = store %t{5}: const int2B
        mov sp, bp
        pop bp
        ret
        @@_c_0_: db 1, 2, 3, 4, 5, 0, 0, 0, 0, 0, 0, 0
      `);
    });
  });

  describe('Assign to array item', () => {
    test('array non bracket assign', () => {
      expect(/* cpp */ `
        void main() {
          int testArray[] = { 1, 2, 3, 4, 5, 6 };
          *(1 + testArray + (2 * 2)) = 123;
        }
      `).toCompiledAsmBeEqual(`
          cpu 386
          ; def main():
          @@_fn_main:
          push bp
          mov bp, sp
          sub sp, 12
          mov word [bp - 12], 1     ; *(testArray{0}: int[6]*2B) = store %1: int2B
          mov word [bp - 10], 2     ; *(testArray{0}: int[6]*2B + %2) = store %2: int2B
          mov word [bp - 8], 3      ; *(testArray{0}: int[6]*2B + %4) = store %3: int2B
          mov word [bp - 6], 4      ; *(testArray{0}: int[6]*2B + %6) = store %4: int2B
          mov word [bp - 4], 5      ; *(testArray{0}: int[6]*2B + %8) = store %5: int2B
          mov word [bp - 2], 123    ; *(testArray{0}: int[6]*2B + %10) = store %123: char1B
          mov sp, bp
          pop bp
          ret
      `);
    });
  });

  describe('Assign specific address', () => {
    test('int: *(addr) = 2;', () => {
      expect(/* cpp */ `
        void main() {
          int* addr = 0xB00;
          *(addr) = 2;
        }
      `).toCompiledAsmBeEqual(`
        cpu 386
        ; def main():
        @@_fn_main:
        push bp
        mov bp, sp
        sub sp, 2
        mov word [bp - 2], 2816   ; *(addr{0}: int**2B) = store %2816: int*2B
        mov bx, [bp - 2]          ; %t{0}: int*2B = load addr{0}: int**2B
        mov word [bx], 2          ; *(%t{0}: int*2B) = store %2: char1B
        mov sp, bp
        pop bp
        ret
      `);
    });

    test('char: *(addr) = 2;', () => {
      expect(/* cpp */ `
        void main() {
          char* addr = 0xB00;
          *(addr) = 2;
        }
      `).toCompiledAsmBeEqual(`
        cpu 386
        ; def main():
        @@_fn_main:
        push bp
        mov bp, sp
        sub sp, 2
        mov word [bp - 2], 2816   ; *(addr{0}: char**2B) = store %2816: char*2B
        mov bx, [bp - 2]          ; %t{0}: char*2B = load addr{0}: char**2B
        mov byte [bx], 2          ; *(%t{0}: char*2B) = store %2: char1B
        mov sp, bp
        pop bp
        ret
      `);
    });
  });

  describe('Pointers', () => {
    test('Assign to struct pointer member', () => {
      expect(/* cpp */ `
        struct Vec2 { int x, y; };
        void main() {
          struct Vec2 vec = { .y = 5 };
          struct Vec2* ptr = &vec;
          vec.y = 6;
          ptr->y = 5;
          int d = ptr->y;
        }
      `).toCompiledAsmBeEqual(`
        cpu 386
        ; def main():
        @@_fn_main:
        push bp
        mov bp, sp
        sub sp, 8
        lea bx, [bp - 4]          ; %t{0}: struct Vec2*2B = lea vec{0}: struct Vec2*2B
        mov word [bp - 6], bx     ; *(ptr{0}: struct Vec2**2B) = store %t{0}: struct Vec2*2B
        mov word [bp - 2], 6      ; *(vec{0}: struct Vec2*2B + %2) = store %6: char1B
        mov di, [bp - 6]          ; %t{3}: struct Vec2*2B = load ptr{0}: struct Vec2**2B
        add di, 2                 ; %t{4}: struct Vec2*2B = %t{3}: struct Vec2*2B plus %2: int2B
        mov word [di], 5          ; *(%t{4}: struct Vec2*2B) = store %5: char1B
        mov si, [bp - 6]          ; %t{5}: struct Vec2*2B = load ptr{0}: struct Vec2**2B
        add si, 2                 ; %t{6}: struct Vec2*2B = %t{5}: struct Vec2*2B plus %2: int2B
        mov ax, [si]              ; %t{7}: int2B = load %t{6}: struct Vec2*2B
        mov word [bp - 8], ax     ; *(d{0}: int*2B) = store %t{7}: int2B
        mov sp, bp
        pop bp
        ret
      `);
    });
  });
});
