import '../utils';

describe('Hanging compound', () => {
  test('initializer with compound expressions', () => {
    expect(/* cpp */ `
      void main() {
        int dupa = (({
                      int c = 3, k, d;

                      k = 16;
                      d = 20;
                      c + k + d * 4;
                    }) *
                    2 * ({
                      int k = 15;
                      k * 2;
                    })) *
                  ({ 5 + 2; });

        asm("xchg dx, dx");
      }
    `).toCompiledAsmBeEqual(`
      cpu 386
      ; def main():
      @@_fn_main:
      push bp
      mov bp, sp
      sub sp, 10
      mov word [bp - 4], 3      ; *(c{0}: int*2B) = store %3: int2B
      mov word [bp - 6], 16     ; *(k{0}: int*2B) = store %16: char1B
      mov word [bp - 8], 20     ; *(d{0}: int*2B) = store %20: char1B
      mov ax, [bp - 4]
      add ax, word [bp - 6]     ; %t{8}: int2B = %t{0}: int2B plus %t{1}: int2B
      mov bx, [bp - 8]
      shl bx, 2                 ; %t{10}: int2B = %t{3}: int2B mul %4: char1B
      add ax, bx                ; %t{11}: int2B = %t{8}: int2B plus %t{10}: int2B
      shl ax, 1                 ; %t{12}: int2B = %t{11}: int2B mul %2: char1B
      mov word [bp - 10], 15    ; *(k{1}: int*2B) = store %15: int2B
      mov cx, [bp - 10]
      shl cx, 1                 ; %t{16}: int2B = %t{13}: int2B mul %2: char1B
      imul ax, cx               ; %t{17}: int2B = %t{12}: int2B mul %t{16}: int2B
      imul ax, 7                ; %t{20}: int2B = %t{17}: int2B mul %7: char1B
      mov word [bp - 2], ax     ; *(dupa{0}: int*2B) = store %t{20}: int2B
      xchg dx, dx
      mov sp, bp
      pop bp
      ret
    `);
  });

  test('compound expression inside if stmt', () => {
    expect(/* cpp */ `
      void main() {
        if (({int a = 1; a;})) {
          asm("xchg dx, dx");
        }
      }
    `).toCompiledAsmBeEqual(`
      cpu 386
      ; def main():
      @@_fn_main:
      push bp
      mov bp, sp
      sub sp, 2
      mov word [bp - 2], 1      ; *(a{0}: int*2B) = store %1: int2B
      cmp word [bp - 2], 0      ; %t{2}: i1:zf = %t{0}: int2B differs %0: int2B
      jz @@_L1                  ; br %t{2}: i1:zf, false: L1
      @@_L2:
      xchg dx, dx
      @@_L1:
      mov sp, bp
      pop bp
      ret
    `);
  });
});
