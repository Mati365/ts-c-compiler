import '../utils';

describe('X87 Math', () => {
  test('basic math', () => {
    expect(/* cpp */ `
      void main() {
        float a = 2;
        float b = 63;
        float d = 666;
        float c = a - b * a + b + (b - a * 2);

        asm("xchg bx, bx");
      }
    `).toCompiledAsmBeEqual(`
      cpu 386
      ; def main():
      @@_fn_main:
      push bp
      mov bp, sp
      sub sp, 16
      fld dword [@@_$LC_0]
      fstp dword [bp - 4]
      fld dword [@@_$LC_1]
      fstp dword [bp - 8]
      fld dword [@@_$LC_2]
      fstp dword [bp - 12]
      fld dword [bp - 4]
      fld dword [bp - 8]
      fmul st0, st1
      fxch st1
      fsub st0, st1
      ffree st1
      fld dword [bp - 8]
      fxch st1
      fadd st0, st1
      fld dword [bp - 4]
      fmul dword [@@_$LC_3]
      fxch st2
      fsub st0, st2
      ffree st2
      fxch st1
      fadd st0, st1
      ffree st1
      fstp dword [bp - 16]
      xchg bx, bx
      mov sp, bp
      pop bp
      ret
      @@_$LC_0: dd 2.0
      @@_$LC_1: dd 63.0
      @@_$LC_2: dd 666.0
      @@_$LC_3: dd 2.0
    `);
  });

  test('increment', () => {
    expect(/* cpp */ `
      void main() {
        float a = 2;
        a++;

        asm("xchg bx, bx");
      }
    `).toCompiledAsmBeEqual(`
      cpu 386
      ; def main():
      @@_fn_main:
      push bp
      mov bp, sp
      sub sp, 4
      fld dword [@@_$LC_0]
      fstp dword [bp - 4]
      fld dword [bp - 4]
      fld1
      fxch st1
      fadd st0, st1
      fstp dword [bp - 4]
      xchg bx, bx
      mov sp, bp
      pop bp
      ret
      @@_$LC_0: dd 2.0
    `);
  });

  test('decrement', () => {
    expect(/* cpp */ `
      void main() {
        float a = 2;
        a--;

        asm("xchg bx, bx");
      }
    `).toCompiledAsmBeEqual(`
      cpu 386
      ; def main():
      @@_fn_main:
      push bp
      mov bp, sp
      sub sp, 4
      fld dword [@@_$LC_0]
      fstp dword [bp - 4]
      fld dword [bp - 4]
      fld1
      fxch st1
      fsub st0, st1
      fstp dword [bp - 4]
      xchg bx, bx
      mov sp, bp
      pop bp
      ret
      @@_$LC_0: dd 2.0
    `);
  });

  test('pi calculation', () => {
    expect(/* cpp */ `
      void main() {
        int nbofterms = 118;
        float x = 0;

        for (int n = 0; n < nbofterms; n++) {
          float z = 1.0 / (2 * n + 1);

          if (n % 2 == 1) {
            z *= -1;
          }

          x = (x + z);
        }

        float pi = 4 * x;
        asm("xchg bx, bx");
      }
    `).toCompiledAsmBeEqual(`
      cpu 386
      ; def main():
      @@_fn_main:
      push bp
      mov bp, sp
      sub sp, 18
      mov word [bp - 2], 118    ; *(nbofterms{0}: int*2B) = store %118: int2B
      fld dword [@@_$LC_0]
      fstp dword [bp - 6]
      mov word [bp - 8], 0      ; *(n{0}: int*2B) = store %0: int2B
      @@_L1:
      mov ax, [bp - 2]
      cmp word [bp - 8], ax     ; %t{2}: i1:zf = icmp %t{0}: int2B less_than %t{1}: int2B
      jl @@_L2                  ; br %t{2}: i1:zf, true: L2, false: L3
      jge @@_L3                 ; br %t{2}: i1:zf, true: L2, false: L3
      @@_L2:
      mov ax, [bp - 8]
      mov bx, ax                ; swap
      shl ax, 1                 ; %t{6}: int2B = %t{5}: int2B mul %2: char1B
      add ax, 1                 ; %t{7}: int2B = %t{6}: int2B plus %1: char1B
      mov word [bp - 14], ax
      fild word [bp - 14]
      fld1
      fdiv st0, st1
      ffree st1
      fstp dword [bp - 12]
      mov ax, bx
      mov bx, word 2
      cdq
      idiv bx                   ; %t{11}: int2B = %t{5}: int2B mod %2: char1B
      cmp dx, 1                 ; %t{12}: i1:zf = icmp %t{11}: int2B equal %1: char1B
      jnz @@_L4                 ; br %t{12}: i1:zf, false: L4
      @@_L5:
      fld dword [bp - 12]
      fmul dword [@@_$LC_1]
      fstp dword [bp - 12]
      @@_L4:
      fld dword [bp - 6]
      fld dword [bp - 12]
      fxch st1
      fadd st0, st1
      ffree st1
      fstp dword [bp - 6]
      mov ax, [bp - 8]
      add ax, 1                 ; %t{4}: int2B = %t{3}: int2B plus %1: int2B
      mov word [bp - 8], ax     ; *(n{0}: int*2B) = store %t{4}: int2B
      jmp @@_L1                 ; jmp L1
      @@_L3:
      fld dword [bp - 6]
      fmul dword [@@_$LC_2]
      fstp dword [bp - 18]
      xchg bx, bx
      mov sp, bp
      pop bp
      ret
      @@_$LC_0: dd 0.0
      @@_$LC_1: dd -1.0
      @@_$LC_2: dd 4.0
    `);
  });

  test('assign float to int', () => {
    expect(/* cpp */ `
      int main() {
        float b = 4;
        int a = b + 3;
        int d = a * b;
        int k = d * 2;
        asm("xchg bx, bx");
      }
    `).toCompiledAsmBeEqual(`
      cpu 386
      ; def main(): [ret: int2B]
      @@_fn_main:
      push bp
      mov bp, sp
      sub sp, 14
      fld dword [@@_$LC_0]
      fstp dword [bp - 4]
      fld dword [bp - 4]
      fadd dword [@@_$LC_1]
      fistp word [bp - 8]
      mov ax, word [bp - 8]
      mov word [bp - 6], ax     ; *(a{0}: int*2B) = store %t{2}: int2B
      fild word [bp - 6]
      fld dword [bp - 4]
      fxch st1
      fmul st0, st1
      ffree st1
      fistp word [bp - 12]
      mov bx, word [bp - 12]
      mov word [bp - 10], bx    ; *(d{0}: int*2B) = store %t{7}: int2B
      mov cx, [bp - 10]
      shl cx, 1                 ; %t{9}: int2B = %t{8}: int2B mul %2: char1B
      mov word [bp - 14], cx    ; *(k{0}: int*2B) = store %t{9}: int2B
      xchg bx, bx
      mov sp, bp
      pop bp
      ret
      @@_$LC_0: dd 4.0
      @@_$LC_1: dd 3.0
    `);
  });
});
