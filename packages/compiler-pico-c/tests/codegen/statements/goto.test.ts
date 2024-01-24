import '../utils';

describe('goto', () => {
  test('basic goto in plain function', () => {
    expect(/* cpp */ `
      void sum() {
        int a = 2;

        goto skok;
        asm("xchg bx, bx");
        skok: int b;
      }

      void main() {
        int a = 2;

        for (;;) {
          ++a;

          if (a > 10) {
            goto exit;
          }
        }

        exit:
        asm("xchg bx, bx");
      }
    `).toCompiledAsmBeEqual(`
      cpu 386
      ; def sum():
      @@_fn_sum:
      push bp
      mov bp, sp
      sub sp, 4
      mov word [bp - 2], 2      ; *(a{0}: int*2B) = store %2: int2B
      jmp @@_F1_skok            ; jmp F1_skok
      xchg bx, bx
      @@_F1_skok:
      mov sp, bp
      pop bp
      ret
      ; def main():
      @@_fn_main:
      push bp
      mov bp, sp
      sub sp, 2
      mov word [bp - 2], 2      ; *(a{1}: int*2B) = store %2: int2B
      @@_L1:
      mov ax, [bp - 2]
      add ax, 1                 ; %t{1}: int2B = %t{0}: int2B plus %1: int2B
      mov word [bp - 2], ax     ; *(a{1}: int*2B) = store %t{1}: int2B
      cmp ax, 10                ; %t{3}: i1:zf = %t{1}: int2B greater_than %10: char1B
      jng @@_L5                 ; br %t{3}: i1:zf, false: L5
      @@_L6:
      jmp @@_L3                 ; jmp L3
      @@_L5:
      jmp @@_L1                 ; jmp L1
      @@_L3:
      xchg bx, bx
      mov sp, bp
      pop bp
      ret
    `);
  });
});
