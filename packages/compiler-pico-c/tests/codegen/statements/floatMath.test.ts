import '../utils';

describe('Float math', () => {
  test('basic math', () => {
    expect(/* cpp */ `
      void main() {
        float a = 2;
        float b = 63;
        float d = 666;
        float c = a - b * a + b + (b - a);

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
      fld dword [bp - 4]
      fxch st1
      fmul st0, st1
      fxch st2
      fsub st0, st2
      fld dword [bp - 8]
      fxch st1
      fadd st0, st1
      fld dword [bp - 8]
      fld dword [bp - 4]
      ffree st7
      fxch st1
      fsub st0, st1
      fxch st2
      fadd st0, st2
      fst dword [bp - 16]
      xchg bx, bx
      mov sp, bp
      pop bp
      ret
      @@_$LC_0: dd 2.0
      @@_$LC_1: dd 63.0
      @@_$LC_2: dd 666.0
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
      fst dword [bp - 4]
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
      fst dword [bp - 4]
      xchg bx, bx
      mov sp, bp
      pop bp
      ret
      @@_$LC_0: dd 2.0
    `);
  });
});
