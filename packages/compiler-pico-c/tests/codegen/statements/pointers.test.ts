import '../utils';

describe('Pointers', () => {
  test('*array[1] access', () => {
    expect(/* cpp */ `
      void main() {
        int array[4][3] = { 1, 2, 3, 4, 5 };
        int sum = *array[1];
        asm("xchg bx, bx");
      }
    `).toCompiledAsmBeEqual(`
      cpu 386
      ; def main():
      @@_fn_main:
      push bp
      mov bp, sp
      sub sp, 26
      mov word [bp - 24], 1     ; *(array{0}: int[4][3]*2B) = store %1: int2B
      mov word [bp - 22], 2     ; *(array{0}: int[4][3]*2B + %2) = store %2: int2B
      mov word [bp - 20], 3     ; *(array{0}: int[4][3]*2B + %4) = store %3: int2B
      mov word [bp - 18], 4     ; *(array{0}: int[4][3]*2B + %6) = store %4: int2B
      mov word [bp - 16], 5     ; *(array{0}: int[4][3]*2B + %8) = store %5: int2B
      lea bx, [bp - 24]         ; %t{0}: int[4][3]*2B = lea array{0}: int[4][3]*2B
      add bx, 6                 ; %t{1}: int[4][3]*2B = %t{0}: int[4][3]*2B plus %6: int2B
      mov ax, [bx]              ; %t{3}: int2B = load %t{2}: int*2B
      mov word [bp - 26], ax    ; *(sum{0}: int*2B) = store %t{3}: int2B
      xchg bx, bx
      mov sp, bp
      pop bp
      ret
    `);
  });

  test('increment char pointer to literal', () => {
    expect(/* cpp */ `
      void main() {
        char* ptr = "Hello world";
        ptr++;
      }
    `).toCompiledAsmBeEqual(`
      cpu 386
      ; def main():
      @@_fn_main:
      push bp
      mov bp, sp
      sub sp, 2
      mov bx, @@_c_0_           ; %t{0}: char*2B = lea c{0}: char[12]*2B
      mov word [bp - 2], bx     ; *(ptr{0}: char**2B) = store %t{0}: char*2B
      mov di, [bp - 2]          ; %t{1}: char*2B = load ptr{0}: char**2B
      add di, 1                 ; %t{2}: char*2B = %t{1}: char*2B plus %1: int2B
      mov word [bp - 2], di     ; *(ptr{0}: char**2B) = store %t{2}: char*2B
      mov sp, bp
      pop bp
      ret
      @@_c_0_:
      db "Hello world", 0x0
    `);
  });

  test('increment char pointer and read', () => {
    expect(/* cpp */ `
      void main() { char* a; char k = *a++; }
    `).toCompiledAsmBeEqual(`
      cpu 386
      ; def main():
      @@_fn_main:
      push bp
      mov bp, sp
      sub sp, 3
      mov bx, [bp - 2]          ; %t{0}: char*2B = load a{0}: char**2B
      mov ax, bx                ; swap
      add bx, 1                 ; %t{1}: char*2B = %t{0}: char*2B plus %1: int2B
      mov word [bp - 2], bx     ; *(a{0}: char**2B) = store %t{1}: char*2B
      mov di, ax
      mov al, [di]              ; %t{2}: char1B = load %t{0}: char*2B
      mov byte [bp - 3], al     ; *(k{0}: char*2B) = store %t{2}: char1B
      mov sp, bp
      pop bp
      ret
    `);
  });

  test('increment Vec2 pointer', () => {
    expect(/* cpp */ `
      struct Vec2 {
        int x, y;
      };

      void inc(const struct Vec2* vec) {
        vec->x++;
      }

      void main() {
        struct Vec2 v = { .x = 1, .y = 5 };

        inc(&v);

        int k = v.x;
        asm("xchg dx, dx");
      }
    `).toCompiledAsmBeEqual(`
      cpu 386
      ; def inc(vec{0}: struct Vec2**2B):
      @@_fn_inc:
      push bp
      mov bp, sp
      mov bx, [bp + 4]          ; %t{0}: struct Vec2*2B = load vec{0}: struct Vec2**2B
      mov ax, [bx]              ; %t{1}: int2B = load %t{0}: int*2B
      add ax, 1                 ; %t{2}: int2B = %t{1}: int2B plus %1: int2B
      mov word [bx], ax         ; *(%t{0}: int*2B) = store %t{2}: int2B
      mov sp, bp
      pop bp
      ret 2
      ; def main():
      @@_fn_main:
      push bp
      mov bp, sp
      sub sp, 6
      mov word [bp - 4], 1      ; *(v{0}: struct Vec2*2B) = store %1: int2B
      mov word [bp - 2], 5      ; *(v{0}: struct Vec2*2B + %2) = store %5: int2B
      lea bx, [bp - 4]          ; %t{4}: struct Vec2**2B = lea v{0}: struct Vec2*2B
      push bx
      call @@_fn_inc
      lea bx, [bp - 4]          ; %t{5}: struct Vec2**2B = lea v{0}: struct Vec2*2B
      mov ax, [bx]              ; %t{6}: int2B = load %t{5}: struct Vec2**2B
      mov word [bp - 6], ax     ; *(k{0}: int*2B) = store %t{6}: int2B
      xchg dx, dx
      mov sp, bp
      pop bp
      ret
    `);
  });

  test('increment array of structs', () => {
    expect(/* cpp */ `
      struct Vec2 {
        char x, y;
      };

      void inc(const struct Vec2* vec) {
        vec->y++;
      }

      void main() {
        struct Vec2 v[2] = { { .x =2, .y = 4}, { .x = 1, .y = 5 } };

        inc(&v[1]);

        char k = v[1].y + v[0].y;
        asm("xchg dx, dx");
      }
    `).toCompiledAsmBeEqual(`
      cpu 386
      ; def inc(vec{0}: struct Vec2**2B):
      @@_fn_inc:
      push bp
      mov bp, sp
      mov bx, [bp + 4]          ; %t{0}: struct Vec2*2B = load vec{0}: struct Vec2**2B
      add bx, 1                 ; %t{1}: char*2B = %t{0}: struct Vec2*2B plus %1: int2B
      mov al, [bx]              ; %t{2}: char1B = load %t{1}: char*2B
      movzx cx, al
      add cx, 1                 ; %t{3}: char1B = %t{2}: char1B plus %1: int2B
      mov byte [bx], cl         ; *(%t{1}: char*2B) = store %t{3}: char1B
      mov sp, bp
      pop bp
      ret 2
      ; def main():
      @@_fn_main:
      push bp
      mov bp, sp
      sub sp, 5
      mov word [bp - 4], 1026   ; *(v{0}: int*2B) = store %1026: int2B
      mov word [bp - 2], 1281   ; *(v{0}: int*2B + %2) = store %1281: int2B
      lea bx, [bp - 4]          ; %t{5}: struct Vec2[2]*2B = lea v{0}: struct Vec2[2]*2B
      add bx, 2                 ; %t{6}: struct Vec2[2]*2B = %t{5}: struct Vec2[2]*2B plus %2: int2B
      push bx
      call @@_fn_inc
      lea bx, [bp - 4]          ; %t{7}: struct Vec2[2]*2B = lea v{0}: struct Vec2[2]*2B
      mov ax, bx                ; swap
      add bx, 3                 ; %t{9}: char*2B = %t{7}: struct Vec2[2]*2B plus %3: int2B
      mov cl, [bx]              ; %t{10}: char1B = load %t{9}: char*2B
      add ax, 1                 ; %t{13}: char*2B = %t{7}: struct Vec2[2]*2B plus %1: int2B
      mov di, ax
      mov al, [di]              ; %t{14}: char1B = load %t{13}: char*2B
      add cl, al                ; %t{15}: char1B = %t{10}: char1B plus %t{14}: char1B
      mov byte [bp - 5], cl     ; *(k{0}: char*2B) = store %t{15}: char1B
      xchg dx, dx
      mov sp, bp
      pop bp
      ret
    `);
  });

  test('increment of struct member in dot syntax', () => {
    expect(/* cpp */ `
      struct Vec2 {
        char x, y;
      };

      void inc(const struct Vec2* vec) {
        (*vec).y += 3;
      }

      void main() {
        struct Vec2 v[2] = { { .x =2, .y = 4}, { .x = 1, .y = 5 } };

        inc(&v[1]);

        char k = v[1].y + v[0].y;
        asm("xchg dx, dx");
      }
    `).toCompiledAsmBeEqual(`
      cpu 386
      ; def inc(vec{0}: struct Vec2**2B):
      @@_fn_inc:
      push bp
      mov bp, sp
      mov bx, [bp + 4]          ; %t{0}: struct Vec2*2B = load vec{0}: struct Vec2**2B
      add bx, 1                 ; %t{1}: char*2B = %t{0}: struct Vec2*2B plus %1: int2B
      mov al, [bx]              ; %t{2}: char1B = load %t{1}: char*2B
      add al, 3                 ; %t{3}: char1B = %t{2}: char1B plus %3: char1B
      mov byte [bx], al         ; *(%t{1}: char*2B) = store %t{3}: char1B
      mov sp, bp
      pop bp
      ret 2
      ; def main():
      @@_fn_main:
      push bp
      mov bp, sp
      sub sp, 5
      mov word [bp - 4], 1026   ; *(v{0}: int*2B) = store %1026: int2B
      mov word [bp - 2], 1281   ; *(v{0}: int*2B + %2) = store %1281: int2B
      lea bx, [bp - 4]          ; %t{5}: struct Vec2[2]*2B = lea v{0}: struct Vec2[2]*2B
      add bx, 2                 ; %t{6}: struct Vec2[2]*2B = %t{5}: struct Vec2[2]*2B plus %2: int2B
      push bx
      call @@_fn_inc
      lea bx, [bp - 4]          ; %t{7}: struct Vec2[2]*2B = lea v{0}: struct Vec2[2]*2B
      mov ax, bx                ; swap
      add bx, 3                 ; %t{9}: char*2B = %t{7}: struct Vec2[2]*2B plus %3: int2B
      mov cl, [bx]              ; %t{10}: char1B = load %t{9}: char*2B
      add ax, 1                 ; %t{13}: char*2B = %t{7}: struct Vec2[2]*2B plus %1: int2B
      mov di, ax
      mov al, [di]              ; %t{14}: char1B = load %t{13}: char*2B
      add cl, al                ; %t{15}: char1B = %t{10}: char1B plus %t{14}: char1B
      mov byte [bp - 5], cl     ; *(k{0}: char*2B) = store %t{15}: char1B
      xchg dx, dx
      mov sp, bp
      pop bp
      ret
    `);
  });
});
