import '../utils';

describe('X87 Functions', () => {
  test('call function `float sum(float a, float b)`', () => {
    expect(/* cpp */ `
      float sum(float a, float b) {
        return b - a;
      }

      void main() {
        float a = 2;
        float b = 7;
        float d = sum(a, b) * 4;

        int k = d;
        int de = k * 2;
        asm("xchg bx, bx");
      }
    `).toCompiledAsmBeEqual(`
      cpu 386
      ; def sum(a{0}: float*2B, b{0}: float*2B): [ret: float4B]
      @@_fn_sum:
      push bp
      mov bp, sp
      fld dword [bp + 8]
      fld dword [bp + 4]
      fxch st1
      fsub st0, st1
      ffree st1
      mov sp, bp
      pop bp
      ret 4
      ; def main():
      @@_fn_main:
      push bp
      mov bp, sp
      sub sp, 20
      fld dword [@@_$LC_0]
      fstp dword [bp - 4]
      fld dword [@@_$LC_1]
      fstp dword [bp - 8]
      fld dword [bp - 4]
      fld dword [bp - 8]
      sub sp, 4
      mov bx, sp
      fstp dword [bx]
      sub sp, 4
      mov bx, sp
      fstp dword [bx]
      call @@_fn_sum
      fst dword [bp - 16]
      fmul dword [@@_$LC_2]
      fstp dword [bp - 12]
      fld dword [bp - 12]
      fistp word [bp - 18]
      mov ax, [bp - 18]
      shl ax, 1                 ; %t{10}: int2B = %t{9}: int2B mul %2: char1B
      mov word [bp - 20], ax    ; *(de{0}: int*2B) = store %t{10}: int2B
      xchg bx, bx
      mov sp, bp
      pop bp
      ret
      @@_$LC_0: dd 2.0
      @@_$LC_1: dd 7.0
      @@_$LC_2: dd 4.0
    `);
  });

  test('advanced function call inside functions', () => {
    expect(/* cpp */ `
      float sum(float a, float b) {
        float asdsad = a + b;
        return a + b;
      }

      void main() {
        if (sum(sum(2, 10), sum(2, 4)) > 10 && (sum(sum(2, 10), sum(2, 4)) < 10 || sum(sum(777, 6), 2) > 500))
        {
          asm("xchg bx, bx");
        }
      }
    `).toCompiledAsmBeEqual(`
      cpu 386
      ; def sum(a{0}: float*2B, b{0}: float*2B): [ret: float4B]
      @@_fn_sum:
      push bp
      mov bp, sp
      sub sp, 4
      fld dword [bp + 4]
      fld dword [bp + 8]
      fxch st1
      fadd st0, st1
      fstp dword [bp - 4]
      fld dword [bp + 4]
      fadd st0, st1
      ffree st1
      mov sp, bp
      pop bp
      ret 4
      ; def main():
      @@_fn_main:
      push bp
      mov bp, sp
      sub sp, 32
      fld dword [@@_$LC_0]
      sub sp, 4
      mov bx, sp
      fstp dword [bx]
      fld dword [@@_$LC_1]
      sub sp, 4
      mov bx, sp
      fstp dword [bx]
      call @@_fn_sum
      fst dword [bp - 4]
      fld dword [@@_$LC_2]
      sub sp, 4
      mov bx, sp
      fstp dword [bx]
      fld dword [@@_$LC_3]
      sub sp, 4
      mov bx, sp
      fstp dword [bx]
      ffree st0
      call @@_fn_sum
      fst dword [bp - 8]
      sub sp, 4
      mov bx, sp
      fstp dword [bx]
      fld dword [bp - 4]
      sub sp, 4
      mov bx, sp
      fstp dword [bx]
      call @@_fn_sum
      fst dword [bp - 12]
      fld dword [@@_$LC_4]
      fxch st1
      fucom st1
      fnstsw ax
      test ah, 69
      jne @@_L1                 ; br %t{12}: i1:zf, false: L1
      @@_L3:
      fld dword [@@_$LC_5]
      sub sp, 4
      mov bx, sp
      fstp dword [bx]
      fld dword [@@_$LC_6]
      sub sp, 4
      mov bx, sp
      fstp dword [bx]
      ffree st0
      ffree st1
      call @@_fn_sum
      fst dword [bp - 16]
      fld dword [@@_$LC_7]
      sub sp, 4
      mov bx, sp
      fstp dword [bx]
      fld dword [@@_$LC_8]
      sub sp, 4
      mov bx, sp
      fstp dword [bx]
      ffree st0
      call @@_fn_sum
      fst dword [bp - 20]
      sub sp, 4
      mov bx, sp
      fstp dword [bx]
      fld dword [bp - 16]
      sub sp, 4
      mov bx, sp
      fstp dword [bx]
      call @@_fn_sum
      fst dword [bp - 24]
      fld dword [@@_$LC_9]
      fucom st1
      fnstsw ax
      test ah, 69
      je @@_L2                  ; br %t{19}: i1:zf, true: L2
      @@_L4:
      fld dword [@@_$LC_10]
      sub sp, 4
      mov bx, sp
      fstp dword [bx]
      fld dword [@@_$LC_11]
      sub sp, 4
      mov bx, sp
      fstp dword [bx]
      ffree st0
      ffree st1
      call @@_fn_sum
      fst dword [bp - 28]
      fld dword [@@_$LC_12]
      sub sp, 4
      mov bx, sp
      fstp dword [bx]
      sub sp, 4
      mov bx, sp
      fstp dword [bx]
      call @@_fn_sum
      fst dword [bp - 32]
      fld dword [@@_$LC_13]
      fxch st1
      fucom st1
      fnstsw ax
      test ah, 69
      je @@_L2                  ; br %t{24}: i1:zf, true: L2
      ffree st0
      jmp @@_L1                 ; jmp L1
      jmp @@_L1                 ; jmp L1
      @@_L2:
      xchg bx, bx
      @@_L1:
      mov sp, bp
      pop bp
      ret
      @@_$LC_0: dd 10.0
      @@_$LC_1: dd 2.0
      @@_$LC_2: dd 4.0
      @@_$LC_3: dd 2.0
      @@_$LC_4: dd 10.0
      @@_$LC_5: dd 10.0
      @@_$LC_6: dd 2.0
      @@_$LC_7: dd 4.0
      @@_$LC_8: dd 2.0
      @@_$LC_9: dd 10.0
      @@_$LC_10: dd 6.0
      @@_$LC_11: dd 777.0
      @@_$LC_12: dd 2.0
      @@_$LC_13: dd 500.0
    `);
  });
});
