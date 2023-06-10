import '../utils';

describe('Pointers', () => {
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
      mov ch, [di]              ; %t{14}: char1B = load %t{13}: char*2B
      add cl, ch                ; %t{15}: char1B = %t{10}: char1B plus %t{14}: char1B
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
      mov ch, [di]              ; %t{14}: char1B = load %t{13}: char*2B
      add cl, ch                ; %t{15}: char1B = %t{10}: char1B plus %t{14}: char1B
      mov byte [bp - 5], cl     ; *(k{0}: char*2B) = store %t{15}: char1B
      xchg dx, dx
      mov sp, bp
      pop bp
      ret
    `);
  });
});
