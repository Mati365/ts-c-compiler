import '../utils';

describe('X87 advanced types accessor', () => {
  test('designated initializer', () => {
    expect(/* cpp */ `
      typedef struct Vec2 {
        float x, y;
      } t_vec2;

      int main() {
        t_vec2 vec = { .y = 4.5 };
        int a = vec.y;
        asm("xchg bx, bx");
      }
    `).toCompiledAsmBeEqual(`
      cpu 386
      ; def main(): [ret: int2B]
      @@_fn_main:
      push bp
      mov bp, sp
      sub sp, 12
      fld dword [@@_$LC_0]
      fstp dword [bp - 4]
      lea bx, [bp - 8]          ; %t{0}: struct Vec2**2B = lea vec{0}: struct Vec2*2B
      add bx, 4                 ; %t{1}: struct Vec2**2B = %t{0}: struct Vec2**2B plus %4: int2B
      fld dword [bx]
      fistp word [bp - 12]
      mov ax, word [bp - 12]
      mov word [bp - 10], ax    ; *(a{0}: int*2B) = store %t{3}: int2B
      xchg bx, bx
      mov sp, bp
      pop bp
      ret
      @@_$LC_0: dd 4.5
    `);
  });

  test('member assign', () => {
    expect(/* cpp */ `
      typedef struct Vec2 {
        float x, y;
      } t_vec2;

      int main() {
        t_vec2 vec;

        vec.x = 5.5;
      }
    `).toCompiledAsmBeEqual(`
      cpu 386
      ; def main(): [ret: int2B]
      @@_fn_main:
      push bp
      mov bp, sp
      sub sp, 8
      fld dword [@@_$LC_0]
      fstp dword [bp - 8]
      mov sp, bp
      pop bp
      ret
      @@_$LC_0: dd 5.5
    `);
  });

  test('array assign', () => {
    expect(/* cpp */ `
      int main() {
        float arr[3];

        arr[0] = 1.2;
        arr[1] = 2.3;
      }
    `).toCompiledAsmBeEqual(`
      cpu 386
      ; def main(): [ret: int2B]
      @@_fn_main:
      push bp
      mov bp, sp
      sub sp, 12
      fld dword [@@_$LC_0]
      fstp dword [bp - 12]
      fld dword [@@_$LC_1]
      fstp dword [bp - 8]
      mov sp, bp
      pop bp
      ret
      @@_$LC_0: dd 1.2
      @@_$LC_1: dd 2.3
    `);
  });

  test('global array read', () => {
    expect(/* cpp */ `
      float arr[] = { 1.0, 1.5, 2.2, 4.5, 6, 7.6 };

      int main() {
        float a = arr[2];
        asm("xchg bx, bx");
      }
    `).toCompiledAsmBeEqual(`
      cpu 386
      ; def main(): [ret: int2B]
      @@_fn_main:
      push bp
      mov bp, sp
      sub sp, 4
      mov ax, @@_c_0_
      add ax, 8                 ; %t{1}: float[6]*2B = %t{0}: float[6]*2B plus %8: int2B
      mov bx, ax
      fld dword [bx]
      fstp dword [bp - 4]
      xchg bx, bx
      mov sp, bp
      pop bp
      ret
      @@_c_0_:
      dd 1, 1.5, 2.2, 4.5, 6, 7.6
    `);
  });

  test('local short array read', () => {
    expect(/* cpp */ `
      int main() {
        float arr[3] = { 1.0, 1.5, 2.2 };
        float a = arr[1];
        asm("xchg bx, bx");
      }
    `).toCompiledAsmBeEqual(`
      cpu 386
      ; def main(): [ret: int2B]
      @@_fn_main:
      push bp
      mov bp, sp
      sub sp, 16
      fld dword [@@_$LC_0]
      fstp dword [bp - 12]
      fld dword [@@_$LC_1]
      fstp dword [bp - 8]
      fld dword [@@_$LC_2]
      fstp dword [bp - 4]
      lea bx, [bp - 12]         ; %t{0}: float[3]*2B = lea arr{0}: float[3]*2B
      add bx, 4                 ; %t{1}: float[3]*2B = %t{0}: float[3]*2B plus %4: int2B
      fld dword [bx]
      fstp dword [bp - 16]
      xchg bx, bx
      mov sp, bp
      pop bp
      ret
      @@_$LC_0: dd 1.0
      @@_$LC_1: dd 1.5
      @@_$LC_2: dd 2.2
    `);
  });

  test('struct attribute read', () => {
    expect(/* cpp */ `
      typedef struct Vec2 {
        char z;
        float x, y;
      } t_vec2;

      int main() {
        t_vec2 vec;

        vec.x = 5.5;
        vec.y = 6.5;

        int sum = vec.x;
        asm("xchg bx, bx");
      }
    `).toCompiledAsmBeEqual(`
      cpu 386
      ; def main(): [ret: int2B]
      @@_fn_main:
      push bp
      mov bp, sp
      sub sp, 13
      lea bx, [bp - 9]          ; %t{0}: struct Vec2**2B = lea vec{0}: struct Vec2*2B
      fld dword [@@_$LC_0]
      fstp dword [bp - 8]
      fld dword [@@_$LC_1]
      fstp dword [bp - 4]
      add bx, 1                 ; %t{5}: struct Vec2**2B = %t{0}: struct Vec2**2B plus %1: int2B
      fld dword [bx]
      fistp word [bp - 13]
      mov ax, word [bp - 13]
      mov word [bp - 11], ax    ; *(sum{0}: int*2B) = store %t{7}: int2B
      xchg bx, bx
      mov sp, bp
      pop bp
      ret
      @@_$LC_0: dd 5.5
      @@_$LC_1: dd 6.5
    `);
  });

  test('sum casted cloned vector struct', () => {
    expect(/* cpp */ `
      typedef struct Vec2 {
        char z;
        float x, y;
      } t_vec2;

      int sum_vec(struct Vec2 vec) {
        return vec.x + vec.y;
      }

      int main() {
        t_vec2 vec;

        vec.x = 5.5;
        vec.y = 6.5;

        int sum = sum_vec(vec);
        asm("xchg bx, bx");
      }
    `).toCompiledAsmBeEqual(`
      cpu 386
      ; def sum_vec(vec{0}: struct Vec2*2B): [ret: int2B]
      @@_fn_sum_vec:
      push bp
      mov bp, sp
      sub sp, 2
      lea bx, [bp + 4]          ; %t{0}: struct Vec2**2B = lea vec{0}: struct Vec2*2B
      mov ax, bx                ; swap
      add bx, 1                 ; %t{1}: struct Vec2**2B = %t{0}: struct Vec2**2B plus %1: int2B
      fld dword [bx]
      add ax, 5                 ; %t{4}: struct Vec2**2B = %t{0}: struct Vec2**2B plus %5: int2B
      mov di, ax
      fld dword [di]
      fxch st1
      fadd st0, st1
      ffree st1
      fistp word [bp - 2]
      mov ax, word [bp - 2]
      mov sp, bp
      pop bp
      ret 2
      ; def main(): [ret: int2B]
      @@_fn_main:
      push bp
      mov bp, sp
      sub sp, 11
      fld dword [@@_$LC_0]
      fstp dword [bp - 8]
      fld dword [@@_$LC_1]
      fstp dword [bp - 4]
      ; Copy of struct - vec{1}: struct Vec2*2B
      push word [bp - 1]
      push word [bp - 3]
      push word [bp - 5]
      push word [bp - 7]
      push word [bp - 9]
      call @@_fn_sum_vec
      mov word [bp - 11], ax    ; *(sum{0}: int*2B) = store %t{13}: int2B
      xchg bx, bx
      mov sp, bp
      pop bp
      ret
      @@_$LC_0: dd 5.5
      @@_$LC_1: dd 6.5
    `);
  });
});
