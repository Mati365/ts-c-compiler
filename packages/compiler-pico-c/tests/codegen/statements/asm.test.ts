import '../utils';

describe('ASM statement', () => {
  test(`
    asm(
      "mov %[dst], %[src]"
      : [dst] "=rm" (b)
      : [src] "r" (a + 3)
    )
  `, () => {
    expect(/* cpp */ `
      void main() {
        int a = 2;
        int b;

        asm(
          "mov %[dst], %[src]"
          : [dst] "=rm" (b)
          : [src] "r" (a + 3)
        );
      }
    `).toCompiledAsmBeEqual(`
      cpu 386
      ; def main():
      @@_fn_main:
      push bp
      mov bp, sp
      sub sp, 4
      mov word [bp - 2], 2      ; *(a{0}: int*2B) = store %2: int2B
      mov ax, [bp - 2]
      add ax, 3                 ; %t{1}: int2B = %t{0}: int2B plus %3: char1B
      mov word [bp - 4], ax
      mov sp, bp
      pop bp
      ret
    `);
  });
});
