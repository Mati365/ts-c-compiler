import '../utils';

describe('Return statement', () => {
  test('do {} while and return stmt', () => {
    expect(/* cpp */ `
      int printf() {
        char currentChar;

        do {
          if (currentChar == '%') {
            asm("xchg bx, bx");
          }
        } while(2);

        return 0;
      }
    `).toCompiledAsmBeEqual(`
      cpu 386
      ; def printf(): [ret: int2B]
      @@_fn_printf:
      push bp
      mov bp, sp
      sub sp, 1
      @@_L1:
      cmp byte [bp - 1], 37     ; %t{1}: i1:zf = icmp %t{0}: char1B equal %37: char1B
      jnz @@_L3                 ; br %t{1}: i1:zf, false: L3
      @@_L4:
      xchg bx, bx
      @@_L3:
      jmp @@_L1                 ; jmp L1
      @@_L2:
      mov ax, word 0
      mov sp, bp
      pop bp
      ret
    `);
  });
});
