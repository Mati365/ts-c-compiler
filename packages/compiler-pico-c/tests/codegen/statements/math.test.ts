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

  test('int b = 1 + ~a', () => {
    expect(/* cpp */ `
      void main() {
        int a = 2;
        int b = 1 + ~a;
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
      xor ax, -1                ; %t{1}: int2B = bit_not %t{0}: int2B
      add ax, 1                 ; %t{2}: int2B = %t{1}: int2B plus %1: char1B
      mov word [bp - 4], ax     ; *(b{0}: int*2B) = store %t{2}: int2B
      mov sp, bp
      pop bp
      ret
    `);
  });

  test('int b = a % 2', () => {
    expect(/* cpp */ `
      void main() {
        int a = 7;
        int b = a % 2;
      }
    `).toCompiledAsmBeEqual(`
      cpu 386
      ; def main():
      @@_fn_main:
      push bp
      mov bp, sp
      sub sp, 4
      mov word [bp - 2], 7      ; *(a{0}: int*2B) = store %7: int2B
      mov ax, [bp - 2]
      mov bx, word 2
      idiv bx                   ; %t{1}: int2B = %t{0}: int2B mod %2: char1B
      mov word [bp - 4], dx     ; *(b{0}: int*2B) = store %t{1}: int2B
      mov sp, bp
      pop bp
      ret
    `);
  });

  test('int b = a / 2', () => {
    expect(/* cpp */ `
      void main() {
        int a = 7;
        int b = a / 2;
      }
    `).toCompiledAsmBeEqual(`
      cpu 386
      ; def main():
      @@_fn_main:
      push bp
      mov bp, sp
      sub sp, 4
      mov word [bp - 2], 7      ; *(a{0}: int*2B) = store %7: int2B
      mov ax, [bp - 2]
      mov bx, word 2
      idiv bx                   ; %t{1}: int2B = %t{0}: int2B div %2: char1B
      mov word [bp - 4], ax     ; *(b{0}: int*2B) = store %t{1}: int2B
      mov sp, bp
      pop bp
      ret
    `);
  });
});
