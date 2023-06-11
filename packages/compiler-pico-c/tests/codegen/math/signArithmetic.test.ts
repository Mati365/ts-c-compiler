import '../utils';

describe('Sign arithmetic', () => {
  describe('Division', () => {
    test('signed divide', () => {
      expect(/* cpp */ `
        void main() {
          int d, e;
          int f = d / e;
        }
      `).toCompiledAsmBeEqual(`
        cpu 386
        ; def main():
        @@_fn_main:
        push bp
        mov bp, sp
        sub sp, 6
        mov ax, [bp - 2]
        cdq
        idiv word [bp - 4]        ; %t{2}: int2B = %t{0}: int2B div %t{1}: int2B
        mov word [bp - 6], ax     ; *(f{0}: int*2B) = store %t{2}: int2B
        mov sp, bp
        pop bp
        ret
      `);
    });

    test('unsigned divide', () => {
      expect(/* cpp */ `
        void main() {
          unsigned int d, e;
          unsigned int f = d / e;
        }
      `).toCompiledAsmBeEqual(`
        cpu 386
        ; def main():
        @@_fn_main:
        push bp
        mov bp, sp
        sub sp, 6
        mov ax, [bp - 2]
        xor dx, dx
        div word [bp - 4]         ; %t{2}: unsigned int2B = %t{0}: unsigned int2B div %t{1}: unsigned int2B
        mov word [bp - 6], ax     ; *(f{0}: unsigned int*2B) = store %t{2}: unsigned int2B
        mov sp, bp
        pop bp
        ret
      `);
    });
  });
});
