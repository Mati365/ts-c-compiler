import '../utils';

describe('Variable assign', () => {
  describe('Assign to plain variable', () => {
    test('assign unsigned int to int', () => {
      expect(/* cpp */ `
        void main() {
          int a = -5;
          unsigned int b = a;
        }
      `).toCompiledAsmBeEqual(`
        cpu 386
        ; def main():
        @@_fn_main:
        push bp
        mov bp, sp
        sub sp, 4
        mov word [bp - 2], -5     ; *(a{0}: int*2B) = store %-5: int2B
        mov ax, [bp - 2]
        mov word [bp - 4], ax     ; *(b{0}: unsigned int*2B) = store %t{1}: unsigned int2B
        mov sp, bp
        pop bp
        ret
      `);
    });

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
        lea bx, [bp - 3]          ; %t{0}: char[3]*2B = lea letters{0}: char[3]*2B
        mov al, [bx]              ; %t{2}: char1B = load %t{1}: char[3]*2B
        movzx cx, al
        shl cx, 1                 ; %t{3}: char1B = %t{2}: char1B mul %2: char1B
        mov ax, [bp - 5]
        mov dx, cx
        add ax, dx                ; %t{5}: int2B = %t{4}: int2B plus %t{3}: char1B
        mov word [bp - 5], ax     ; *(a{0}: int*2B) = store %t{5}: int2B
        mov sp, bp
        pop bp
        ret
      `);
    });

    test('compiler reuses variable that is already placed in reg', () => {
      expect(/* cpp */ `
        void main() {
          int a = 2;
          a = a + 6;
          a = a + 5;
        }
      `).toCompiledAsmBeEqual(`
        cpu 386
        ; def main():
        @@_fn_main:
        push bp
        mov bp, sp
        sub sp, 2
        mov word [bp - 2], 2      ; *(a{0}: int*2B) = store %2: int2B
        mov ax, [bp - 2]
        add ax, 11                ; %t{3}: int2B = %t{0}: int2B plus %11: char1B
        mov word [bp - 2], ax     ; *(a{0}: int*2B) = store %t{3}: int2B
        mov sp, bp
        pop bp
        ret
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
        push ax                   ; preserve: %t{1}
        call @@_fn_sum
        pop ax                    ; restore: %t{1}
        add ax, 5                 ; %t{4}: int2B = %t{1}: int2B plus %5: char1B
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
        lea bx, [bp - 4]          ; %t{0}: struct Vec2**2B = lea vec{0}: struct Vec2*2B
        mov ax, [bx]              ; %t{1}: int2B = load %t{0}: struct Vec2**2B
        add bx, 2                 ; %t{3}: struct Vec2**2B = %t{0}: struct Vec2**2B plus %2: int2B
        mov cx, [bx]              ; %t{4}: int2B = load %t{3}: struct Vec2**2B
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
        lea bx, [bp - 10]         ; %t{0}: struct Vec2[2]*2B = lea vec{0}: struct Vec2[2]*2B
        mov ax, bx                ; swap
        add bx, 4                 ; %t{2}: char*2B = %t{0}: struct Vec2[2]*2B plus %4: int2B
        mov cl, [bx]              ; %t{3}: char1B = load %t{2}: char*2B
        add ax, 5                 ; %t{5}: struct Vec2[2]*2B = %t{0}: struct Vec2[2]*2B plus %5: int2B
        mov di, ax
        mov ax, [di]              ; %t{6}: int2B = load %t{5}: int*2B
        movzx cx, cl
        add cx, ax                ; %t{8}: int2B = %t{7}: int2B plus %t{6}: int2B
        mov word [bp - 12], cx    ; *(sum{0}: int*2B) = store %t{8}: int2B
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
        mov bx, @@_c_0_           ; %t{0}: const int*2B = lea c{0}: const int[12]*2B
        mov word [bp - 2], bx     ; *(array{0}: const int**2B) = store %t{0}: const int*2B
        mov di, [bp - 2]          ; %t{1}: const int*2B = load array{0}: const int**2B
        add di, 6                 ; %t{2}: const int*2B = %t{1}: const int*2B plus %6: int2B
        mov ax, [di]              ; %t{3}: const int2B = load %t{2}: const int*2B
        add ax, 12                ; %t{6}: const int2B = %t{3}: const int2B plus %12: char1B
        mov word [bp - 4], ax     ; *(sum{0}: int*2B) = store %t{6}: const int2B
        mov sp, bp
        pop bp
        ret
        @@_c_0_:
        dw 1, 2, 3, 4, 5
        dw 0, 0, 0, 0, 0, 0, 0
      `);
    });

    test('assign and inc struct member', () => {
      expect(/* cpp */ `
        struct Vec2 { int x, y; };
          void main() {
          struct Vec2 vec = { .y = 5 };

          vec.y++;
          vec.y += 3;
        }
      `).toCompiledAsmBeEqual(`
        cpu 386
        ; def main():
        @@_fn_main:
        push bp
        mov bp, sp
        sub sp, 4
        mov word [bp - 2], 5      ; *(vec{0}: struct Vec2*2B + %2) = store %5: int2B
        lea bx, [bp - 4]          ; %t{0}: struct Vec2**2B = lea vec{0}: struct Vec2*2B
        mov ax, bx                ; swap
        add bx, 2                 ; %t{1}: struct Vec2**2B = %t{0}: struct Vec2**2B plus %2: int2B
        mov cx, [bx]              ; %t{2}: int2B = load %t{1}: struct Vec2**2B
        add cx, 1                 ; %t{3}: int2B = %t{2}: int2B plus %1: int2B
        mov word [bp - 2], cx     ; *(vec{0}: struct Vec2*2B + %2) = store %t{3}: int2B
        add ax, 2                 ; %t{5}: struct Vec2**2B = %t{0}: struct Vec2**2B plus %2: int2B
        mov di, ax
        mov ax, [di]              ; %t{6}: struct Vec2*2B = load %t{5}: struct Vec2**2B
        add ax, 3                 ; %t{7}: struct Vec2*2B = %t{6}: struct Vec2*2B plus %3: char1B
        mov word [bp - 2], ax     ; *(vec{0}: struct Vec2*2B + %2) = store %t{7}: struct Vec2*2B
        mov sp, bp
        pop bp
        ret
      `);
    });

    test.skip('lvalue variable member assign', () => {
      expect(/* cpp */ `
        void main() {
          int x = 4;
          int y = 10;
          int s = (x=y);
          asm("xchg bx, bx");
        }
      `).toCompiledAsmBeEqual(`
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
          mov word [bp - 2], 6      ; *(testArray{0}: int[6]*2B + %10) = store %6: int2B
          mov word [bp - 2], 123    ; *(testArray{0}: int[6]*2B + %10) = store %123: char1B
          mov sp, bp
          pop bp
          ret
      `);
    });

    test('assign and inc array members', () => {
      expect(/* cpp */ `
        struct Vec2 { int x, y; };
          void main() {
          struct Vec2 vec[] = { { .y = 5 }, { .x = 2} };

          vec[0].y++;
          vec[1].x += 3;
        }
      `).toCompiledAsmBeEqual(`
        cpu 386
        ; def main():
        @@_fn_main:
        push bp
        mov bp, sp
        sub sp, 8
        mov word [bp - 6], 5      ; *(vec{0}: struct Vec2[2]*2B + %2) = store %5: int2B
        mov word [bp - 4], 2      ; *(vec{0}: struct Vec2[2]*2B + %4) = store %2: int2B
        lea bx, [bp - 8]          ; %t{0}: struct Vec2[2]*2B = lea vec{0}: struct Vec2[2]*2B
        mov ax, bx                ; swap
        add bx, 2                 ; %t{2}: int*2B = %t{0}: struct Vec2[2]*2B plus %2: int2B
        mov cx, [bx]              ; %t{3}: int2B = load %t{2}: int*2B
        add cx, 1                 ; %t{4}: int2B = %t{3}: int2B plus %1: int2B
        mov word [bp - 6], cx     ; *(vec{0}: struct Vec2[2]*2B + %2) = store %t{4}: int2B
        add ax, 4                 ; %t{6}: struct Vec2[2]*2B = %t{0}: struct Vec2[2]*2B plus %4: int2B
        mov di, ax
        mov ax, [di]              ; %t{7}: int2B = load %t{6}: int*2B
        add ax, 3                 ; %t{8}: int2B = %t{7}: int2B plus %3: char1B
        mov word [bp - 4], ax     ; *(vec{0}: struct Vec2[2]*2B + %4) = store %t{8}: int2B
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
        mov word [bp - 2], 5      ; *(vec{0}: struct Vec2*2B + %2) = store %5: int2B
        lea bx, [bp - 4]          ; %t{0}: struct Vec2**2B = lea vec{0}: struct Vec2*2B
        mov word [bp - 6], bx     ; *(ptr{0}: struct Vec2**2B) = store %t{0}: struct Vec2**2B
        mov word [bp - 2], 6      ; *(vec{0}: struct Vec2*2B + %2) = store %6: char1B
        mov di, [bp - 6]          ; %t{3}: struct Vec2*2B = load ptr{0}: struct Vec2**2B
        add di, 2                 ; %t{4}: int*2B = %t{3}: struct Vec2*2B plus %2: int2B
        mov word [di], 5          ; *(%t{4}: int*2B) = store %5: char1B
        mov si, [bp - 6]          ; %t{5}: struct Vec2*2B = load ptr{0}: struct Vec2**2B
        add si, 2                 ; %t{6}: int*2B = %t{5}: struct Vec2*2B plus %2: int2B
        mov ax, [si]              ; %t{7}: int2B = load %t{6}: int*2B
        mov word [bp - 8], ax     ; *(d{0}: int*2B) = store %t{7}: int2B
        mov sp, bp
        pop bp
        ret
      `);
    });
  });

  describe('Struct', () => {
    test('assign struct to struct', () => {
      expect(/* cpp */ `
        typedef struct Vec2 {
          int x, y;
        } vec2_t;

        void main() {
          vec2_t a = { .x = 6, .y  = 2};
          vec2_t b = a;

          a.x += 2;
          b.x += 9;

          int k = b.x + a.x;
          asm("xchg dx, dx");
        }
      `).toCompiledAsmBeEqual(`
        cpu 386
        ; def main():
        @@_fn_main:
        push bp
        mov bp, sp
        sub sp, 10
        mov word [bp - 4], 6      ; *(a{0}: struct Vec2*2B) = store %6: int2B
        mov word [bp - 2], 2      ; *(a{0}: struct Vec2*2B + %2) = store %2: int2B
        ; memcpy a{0}: struct Vec2*2B -> b{0}: struct Vec2*2B
        lea bx, [bp - 4]
        lea di, [bp - 8]
        ; offset = 0B
        mov ax, word [bx]
        mov word [di], ax
        ; offset = 2B
        mov ax, word [bx + 2]
        mov word [di + 2], ax
        lea bx, [bp - 4]          ; %t{0}: struct Vec2**2B = lea a{0}: struct Vec2*2B
        mov ax, [bx]              ; %t{1}: struct Vec2*2B = load %t{0}: struct Vec2**2B
        add ax, 2                 ; %t{2}: struct Vec2*2B = %t{1}: struct Vec2*2B plus %2: char1B
        mov word [bp - 4], ax     ; *(a{0}: struct Vec2*2B) = store %t{2}: struct Vec2*2B
        lea di, [bp - 8]          ; %t{3}: struct Vec2**2B = lea b{0}: struct Vec2*2B
        mov cx, [di]              ; %t{4}: struct Vec2*2B = load %t{3}: struct Vec2**2B
        add cx, 9                 ; %t{5}: struct Vec2*2B = %t{4}: struct Vec2*2B plus %9: char1B
        mov word [bp - 8], cx     ; *(b{0}: struct Vec2*2B) = store %t{5}: struct Vec2*2B
        mov dx, [di]              ; %t{7}: int2B = load %t{3}: struct Vec2**2B
        mov ax, [bx]              ; %t{9}: int2B = load %t{0}: struct Vec2**2B
        add dx, ax                ; %t{10}: int2B = %t{7}: int2B plus %t{9}: int2B
        mov word [bp - 10], dx    ; *(k{0}: int*2B) = store %t{10}: int2B
        xchg dx, dx
        mov sp, bp
        pop bp
        ret
      `);
    });

    test('lvalue struct member true ternary', () => {
      expect(/* cpp */ `
        void main() {
          struct {int a;} x={1}, y={2};
          int s = (1?x:y).a;
          asm("xchg bx, bx");
        }
      `).toCompiledAsmBeEqual(`
        cpu 386
        ; def main():
        @@_fn_main:
        push bp
        mov bp, sp
        sub sp, 8
        mov word [bp - 2], 1      ; *(x{0}: struct <anonymous>*2B) = store %1: int2B
        mov word [bp - 4], 2      ; *(y{0}: struct <anonymous>*2B) = store %2: int2B
        mov ax, word 1
        cmp ax, 0                 ; %t{1}: i1:zf = icmp %1: char1B differs %0: int2B
        jz @@_L3                  ; br %t{1}: i1:zf, false: L3
        @@_L2:
        lea bx, [bp - 2]          ; %t{2}: struct <anonymous>*2B = lea:φ x{0}: struct <anonymous>*2B
        jmp @@_L1                 ; jmp L1
        @@_L3:
        lea bx, [bp - 4]          ; %t{3}: struct <anonymous>*2B = lea:φ y{0}: struct <anonymous>*2B
        @@_L1:
        mov cx, [bx]              ; %t{4}: int2B = load %t{0}: int*2B
        mov word [bp - 6], cx     ; *(s{0}: int*2B) = store %t{4}: int2B
        xchg bx, bx
        mov sp, bp
        pop bp
        ret
      `);
    });

    test('lvalue struct member false ternary', () => {
      expect(/* cpp */ `
        void main() {
          struct {int a;} x={1}, y={2};
          int s = (0?x:y).a;
          asm("xchg bx, bx");
        }
      `).toCompiledAsmBeEqual(`
        cpu 386
        ; def main():
        @@_fn_main:
        push bp
        mov bp, sp
        sub sp, 8
        mov word [bp - 2], 1      ; *(x{0}: struct <anonymous>*2B) = store %1: int2B
        mov word [bp - 4], 2      ; *(y{0}: struct <anonymous>*2B) = store %2: int2B
        mov ax, word 0
        cmp ax, 0                 ; %t{1}: i1:zf = icmp %0: char1B differs %0: int2B
        jz @@_L3                  ; br %t{1}: i1:zf, false: L3
        @@_L2:
        lea bx, [bp - 2]          ; %t{2}: struct <anonymous>*2B = lea:φ x{0}: struct <anonymous>*2B
        jmp @@_L1                 ; jmp L1
        @@_L3:
        lea bx, [bp - 4]          ; %t{3}: struct <anonymous>*2B = lea:φ y{0}: struct <anonymous>*2B
        @@_L1:
        mov cx, [bx]              ; %t{4}: int2B = load %t{0}: int*2B
        mov word [bp - 6], cx     ; *(s{0}: int*2B) = store %t{4}: int2B
        xchg bx, bx
        mov sp, bp
        pop bp
        ret
      `);
    });

    test.skip('lvalue struct member assign', () => {
      expect(/* cpp */ `
        void main() {
          struct {int a;} x={1}, y={2};
          int s = (x=y).a;
          asm("xchg bx, bx");
        }
      `).toCompiledAsmBeEqual(`
      `);
    });
  });

  describe('Mix', () => {
    test('const char* as struct member and strlen', () => {
      expect(/* cpp */ `
        int strlen(const char* str) {
          for (int i = 0;;++i) {
            if (*(str + i) == 0) {
              return i;
            }
          }

          return -1;
        }

        struct Vec2 { int x, y; const char* str; };

        void main() {
          struct Vec2 vec[] = { { .y = 5 }, { .x = 4} };

          vec[0].str = "Hello world!";
          vec[0].y++;
          vec[1].x += 3;

          int k = vec[1].x + strlen(vec[0].str);
          asm("xchg dx, dx");
        }
      `).toCompiledAsmBeEqual(`
        cpu 386
        ; def strlen(str{0}: const char**2B): [ret: int2B]
        @@_fn_strlen:
        push bp
        mov bp, sp
        sub sp, 2
        mov word [bp - 2], 0      ; *(i{0}: int*2B) = store %0: int2B
        @@_L1:
        mov bx, [bp + 4]          ; %t{2}: const char*2B = load str{0}: const char**2B
        add bx, word [bp - 2]     ; %t{4}: const char*2B = %t{2}: const char*2B plus %t{3}: int2B
        mov al, [bx]              ; %t{5}: const char1B = load %t{4}: const char*2B
        cmp al, 0                 ; %t{6}: i1:zf = icmp %t{5}: const char1B equal %0: char1B
        jnz @@_L4                 ; br %t{6}: i1:zf, false: L4
        @@_L5:
        mov ax, [bp - 2]
        mov sp, bp
        pop bp
        ret 2
        @@_L4:
        mov ax, [bp - 2]
        add ax, 1                 ; %t{1}: int2B = %t{0}: int2B plus %1: int2B
        mov word [bp - 2], ax     ; *(i{0}: int*2B) = store %t{1}: int2B
        jmp @@_L1                 ; jmp L1
        @@_L3:
        mov ax, word -1
        mov sp, bp
        pop bp
        ret 2
        ; def main():
        @@_fn_main:
        push bp
        mov bp, sp
        sub sp, 14
        mov word [bp - 10], 5     ; *(vec{0}: struct Vec2[2]*2B + %2) = store %5: int2B
        mov word [bp - 6], 4      ; *(vec{0}: struct Vec2[2]*2B + %6) = store %4: int2B
        lea bx, [bp - 12]         ; %t{10}: struct Vec2[2]*2B = lea vec{0}: struct Vec2[2]*2B
        mov ax, [@@_c_0_]         ; %t{14}: const char*2B = load %t{13}: const char**2B
        mov word [bp - 8], ax     ; *(vec{0}: struct Vec2[2]*2B + %4) = store %t{14}: const char*2B
        mov cx, bx                ; swap
        add bx, 2                 ; %t{17}: int*2B = %t{10}: struct Vec2[2]*2B plus %2: int2B
        mov dx, [bx]              ; %t{18}: int2B = load %t{17}: int*2B
        add dx, 1                 ; %t{19}: int2B = %t{18}: int2B plus %1: int2B
        mov word [bp - 10], dx    ; *(vec{0}: struct Vec2[2]*2B + %2) = store %t{19}: int2B
        mov ax, cx                ; swap
        add cx, 6                 ; %t{21}: struct Vec2[2]*2B = %t{10}: struct Vec2[2]*2B plus %6: int2B
        mov bx, cx
        mov cx, [bx]              ; %t{22}: int2B = load %t{21}: int*2B
        add cx, 3                 ; %t{23}: int2B = %t{22}: int2B plus %3: char1B
        mov word [bp - 6], cx     ; *(vec{0}: struct Vec2[2]*2B + %6) = store %t{23}: int2B
        mov dx, ax                ; swap
        add ax, 6                 ; %t{25}: struct Vec2[2]*2B = %t{10}: struct Vec2[2]*2B plus %6: int2B
        mov di, ax
        mov ax, [di]              ; %t{26}: int2B = load %t{25}: int*2B
        add dx, 4                 ; %t{30}: const char**2B = %t{10}: struct Vec2[2]*2B plus %4: int2B
        mov si, dx
        mov dx, [si]              ; %t{31}: const char*2B = load %t{30}: const char**2B
        xchg ax, bx
        push bx                   ; preserve: %t{26}
        push dx
        call @@_fn_strlen
        pop bx                    ; restore: %t{26}
        add bx, ax                ; %t{33}: int2B = %t{26}: int2B plus %t{32}: int2B
        mov word [bp - 14], bx    ; *(k{0}: int*2B) = store %t{33}: int2B
        xchg dx, dx
        mov sp, bp
        pop bp
        ret
        @@_c_0_:
        dw @@_c_0_@str$0_0
        @@_c_0_@str$0_0: db "Hello world!", 0x0
      `);
    });
  });
});
