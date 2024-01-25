import '../utils';

describe('Literal', () => {
  test('literal with double quote', () => {
    expect(/* cpp */ `
      void main() {
        const char* str = "justif: \\"%-10s\\"\\n";
      }
    `).toCompiledAsmBeEqual(`
      cpu 386
      ; def main():
      @@_fn_main:
      push bp
      mov bp, sp
      sub sp, 2
      mov bx, @@_c_0_           ; %t{0}: const char*2B = lea c{0}: const char[17]*2B
      mov word [bp - 2], bx     ; *(str{0}: const char**2B) = store %t{0}: const char*2B
      mov sp, bp
      pop bp
      ret
      @@_c_0_:
      db "justif: \\"%-10s\\"\\n", 0x0
    `);
  });
});
