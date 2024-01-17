import '../utils';

describe('X87 Conditions', () => {
  test('Equal', () => {
    expect(/* cpp */ `
      void main() {
        float a = 7;

        if (a + 4 == 11) {
          asm("xchg bx, bx");
        }
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
      fadd dword [@@_$LC_1]
      fld dword [@@_$LC_2]
      fxch st1
      fucom st1
      fnstsw ax
      and ah, 69
      xor ah, 64
      jne @@_L1                 ; br %t{2}: i1:zf, false: L1
      @@_L2:
      xchg bx, bx
      @@_L1:
      mov sp, bp
      pop bp
      ret
      @@_$LC_0: dd 7.0
      @@_$LC_1: dd 4.0
      @@_$LC_2: dd 11.0
    `);
  });

  test('Differs', () => {
    expect(/* cpp */ `
      void main() {
        float a = 7;

        if (a + 4 != 14) {
          asm("xchg bx, bx");
        }
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
      fadd dword [@@_$LC_1]
      fld dword [@@_$LC_2]
      fxch st1
      fucom st1
      fnstsw ax
      and ah, 69
      cmp ah, 64
      je @@_L1                  ; br %t{2}: i1:zf, false: L1
      @@_L2:
      xchg bx, bx
      @@_L1:
      mov sp, bp
      pop bp
      ret
      @@_$LC_0: dd 7.0
      @@_$LC_1: dd 4.0
      @@_$LC_2: dd 14.0
    `);
  });

  test('Less than', () => {
    expect(/* cpp */ `
      void main() {
        float a = 7;

        if (a + 4 < 20) {
          asm("xchg bx, bx");
        }
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
      fadd dword [@@_$LC_1]
      fld dword [@@_$LC_2]
      fucom st1
      fnstsw ax
      test ah, 69
      jne @@_L1                 ; br %t{2}: i1:zf, false: L1
      @@_L2:
      xchg bx, bx
      @@_L1:
      mov sp, bp
      pop bp
      ret
      @@_$LC_0: dd 7.0
      @@_$LC_1: dd 4.0
      @@_$LC_2: dd 20.0
    `);
  });

  test('Greater than', () => {
    expect(/* cpp */ `
      void main() {
        float a = 7;

        if (a + 4 > 10) {
          asm("xchg bx, bx");
        }
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
      fadd dword [@@_$LC_1]
      fld dword [@@_$LC_2]
      fxch st1
      fucom st1
      fnstsw ax
      test ah, 69
      jne @@_L1                 ; br %t{2}: i1:zf, false: L1
      @@_L2:
      xchg bx, bx
      @@_L1:
      mov sp, bp
      pop bp
      ret
      @@_$LC_0: dd 7.0
      @@_$LC_1: dd 4.0
      @@_$LC_2: dd 10.0
    `);
  });

  test('Less equal than', () => {
    expect(/* cpp */ `
      void main() {
        float a = 7;

        if (a + 4 <= 11) {
          asm("xchg bx, bx");
        }
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
      fadd dword [@@_$LC_1]
      fld dword [@@_$LC_2]
      fucom st1
      fnstsw ax
      test ah, 5
      jne @@_L1                 ; br %t{2}: i1:zf, false: L1
      @@_L2:
      xchg bx, bx
      @@_L1:
      mov sp, bp
      pop bp
      ret
      @@_$LC_0: dd 7.0
      @@_$LC_1: dd 4.0
      @@_$LC_2: dd 11.0
    `);
  });

  test('Greater equal than', () => {
    expect(/* cpp */ `
      void main() {
        float a = 7;

        if (a + 4 >= 8) {
          asm("xchg bx, bx");
        }
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
      fadd dword [@@_$LC_1]
      fld dword [@@_$LC_2]
      fxch st1
      fucom st1
      fnstsw ax
      test ah, 5
      jne @@_L1                 ; br %t{2}: i1:zf, false: L1
      @@_L2:
      xchg bx, bx
      @@_L1:
      mov sp, bp
      pop bp
      ret
      @@_$LC_0: dd 7.0
      @@_$LC_1: dd 4.0
      @@_$LC_2: dd 8.0
    `);
  });

  test('Advanced condition: a + b == 16 || a * b - 2 == 68', () => {
    expect(/* cpp */ `
      void main() {
        float a = 7;
        float b = 10;

        if (a + b == 16 || a * b - 2 == 68) {
          asm("xchg bx, bx");
        }
      }
    `).toCompiledAsmBeEqual(`
      cpu 386
      ; def main():
      @@_fn_main:
      push bp
      mov bp, sp
      sub sp, 8
      fld dword [@@_$LC_0]
      fstp dword [bp - 4]
      fld dword [@@_$LC_1]
      fstp dword [bp - 8]
      fld dword [bp - 4]
      fld dword [bp - 8]
      fxch st1
      fadd st0, st1
      ffree st1
      fld dword [@@_$LC_2]
      fxch st1
      fucom st1
      fnstsw ax
      and ah, 69
      xor ah, 64
      je @@_L2                  ; br %t{3}: i1:zf, true: L2
      @@_L3:
      fld dword [bp - 4]
      fld dword [bp - 8]
      fxch st1
      fmul st0, st1
      ffree st1
      ffree st2
      fsub dword [@@_$LC_3]
      fld dword [@@_$LC_4]
      fxch st1
      fucom st1
      fnstsw ax
      and ah, 69
      xor ah, 64
      je @@_L2                  ; br %t{8}: i1:zf, true: L2
      jmp @@_L1                 ; jmp L1
      @@_L2:
      xchg bx, bx
      @@_L1:
      mov sp, bp
      pop bp
      ret
      @@_$LC_0: dd 7.0
      @@_$LC_1: dd 10.0
      @@_$LC_2: dd 16.0
      @@_$LC_3: dd 2.0
      @@_$LC_4: dd 68.0
    `);
  });

  test('Advanced condition: a + 4 >= 8 && a < 30 && (a + b == 16 || a * b - 2 == 68)', () => {
    expect(/* cpp */ `
      void main() {
        float a = 7;
        float b = 10;
        float c = 11;

        if (a + 4 >= 8 && a < b + c / 4 && (a + b == 117 || a * b == 81 - c)) {
          asm("xchg bx, bx");
        }
      }
    `).toCompiledAsmBeEqual(`
    cpu 386
    ; def main():
    @@_fn_main:
    push bp
    mov bp, sp
    sub sp, 12
    fld dword [@@_$LC_0]
    fstp dword [bp - 4]
    fld dword [@@_$LC_1]
    fstp dword [bp - 8]
    fld dword [@@_$LC_2]
    fstp dword [bp - 12]
    fld dword [bp - 4]
    fadd dword [@@_$LC_3]
    fld dword [@@_$LC_4]
    fxch st1
    fucom st1
    fnstsw ax
    test ah, 5
    jne @@_L1                 ; br %t{2}: i1:zf, false: L1
    @@_L3:
    fld dword [bp - 4]
    fld dword [bp - 8]
    fld dword [bp - 12]
    fdiv dword [@@_$LC_5]
    ffree st3
    fxch st1
    fadd st0, st1
    ffree st1
    fucom st2
    fnstsw ax
    test ah, 69
    jne @@_L1                 ; br %t{8}: i1:zf, false: L1
    @@_L4:
    fld dword [bp - 4]
    fld dword [bp - 8]
    fxch st1
    fadd st0, st1
    ffree st1
    ffree st2
    ffree st4
    fld dword [@@_$LC_6]
    fxch st1
    fucom st1
    fnstsw ax
    and ah, 69
    xor ah, 64
    je @@_L2                  ; br %t{12}: i1:zf, true: L2
    @@_L5:
    fxch st7
    fxch st0
    fxch st7
    ffree st7
    fld dword [bp - 4]
    fld dword [bp - 8]
    fxch st1
    fmul st0, st1
    ffree st2
    ffree st1
    fld dword [bp - 12]
    fld dword [@@_$LC_7]
    fsub st0, st1
    ffree st1
    fxch st2
    fucom st2
    fnstsw ax
    and ah, 69
    xor ah, 64
    je @@_L2                  ; br %t{18}: i1:zf, true: L2
    jmp @@_L1                 ; jmp L1
    jmp @@_L1                 ; jmp L1
    jmp @@_L1                 ; jmp L1
    @@_L2:
    xchg bx, bx
    @@_L1:
    mov sp, bp
    pop bp
    ret
    @@_$LC_0: dd 7.0
    @@_$LC_1: dd 10.0
    @@_$LC_2: dd 11.0
    @@_$LC_3: dd 4.0
    @@_$LC_4: dd 8.0
    @@_$LC_5: dd 4.0
    @@_$LC_6: dd 117.0
    @@_$LC_7: dd 81.0
    `);
  });
});
