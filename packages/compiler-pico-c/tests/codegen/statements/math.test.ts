import '../utils';

describe('Math', () => {
  test('bit shifts', () => {
    expect(/* cpp */ `
      void main() {
        int a = 14;
        int c = 4;

        a <<= c;
        a >>= 2;
      }
    `).toCompiledAsmBeEqual(`
      cpu 386
      ; def main():
      @@_fn_main:
      push bp
      mov bp, sp
      sub sp, 4
      mov word [bp - 2], 14     ; *(a{0}: int*2B) = store %14: int2B
      mov word [bp - 4], 4      ; *(c{0}: int*2B) = store %4: int2B
      mov ax, [bp - 2]
      mov cx, [bp - 4]
      sal ax, cl                ; %t{2}: int2B = %t{1}: int2B bit_shift_left %t{0}: int2B
      sar ax, 2                 ; %t{4}: int2B = %t{2}: int2B bit_shift_right %2: char1B
      mov word [bp - 2], ax     ; *(a{0}: int*2B) = store %t{4}: int2B
      mov sp, bp
      pop bp
      ret
    `);
  });
});
