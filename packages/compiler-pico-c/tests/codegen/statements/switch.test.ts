import '../utils';

describe('Switch', () => {
  test('switch statement without default', () => {
    expect(/* cpp */ `
      void main() {
        int a = 2;
        int b;

        switch (a) {
          case 3:
          b = 6;
          break;

          case 4:
          b = 7;
          break;
        }
      }
    `).toCompiledAsmBeEqual(`
      cpu 386
      ; def main():
      @@_fn_main:
      push bp
      mov bp, sp
      sub sp, 4
      mov word [bp - 2], 2      ; *(a{0}: int*2B) = store %2: int2B
      ; Case #1
      cmp word [bp - 2], 3      ; %t{1}: i1:zf = icmp %t{0}: int2B equal %3: char1B
      jnz @@_L3                 ; br %t{1}: i1:zf, false: L3
      mov word [bp - 4], 6      ; *(b{0}: int*2B) = store %6: char1B
      jmp @@_L4                 ; jmp L4
      @@_L3:
      ; Case #2
      cmp word [bp - 2], 4      ; %t{2}: i1:zf = icmp %t{0}: int2B equal %4: char1B
      jnz @@_L4                 ; br %t{2}: i1:zf, false: L4
      mov word [bp - 4], 7      ; *(b{0}: int*2B) = store %7: char1B
      @@_L4:
      mov sp, bp
      pop bp
      ret
    `);
  });

  test('switch statement with default', () => {
    expect(/* cpp */ `
      void main() {
        int a = 2;
        int b;

        switch (a) {
          case 3:
          b = 6;
          break;

          case 4:
          b = 7;
          break;

          default:
          b = 8;
        }
      }
    `).toCompiledAsmBeEqual(`
      cpu 386
      ; def main():
      @@_fn_main:
      push bp
      mov bp, sp
      sub sp, 4
      mov word [bp - 2], 2      ; *(a{0}: int*2B) = store %2: int2B
      ; Case #1
      cmp word [bp - 2], 3      ; %t{1}: i1:zf = icmp %t{0}: int2B equal %3: char1B
      jnz @@_L3                 ; br %t{1}: i1:zf, false: L3
      mov word [bp - 4], 6      ; *(b{0}: int*2B) = store %6: char1B
      jmp @@_L1                 ; jmp L1
      @@_L3:
      ; Case #2
      cmp word [bp - 2], 4      ; %t{2}: i1:zf = icmp %t{0}: int2B equal %4: char1B
      jnz @@_L4                 ; br %t{2}: i1:zf, false: L4
      mov word [bp - 4], 7      ; *(b{0}: int*2B) = store %7: char1B
      jmp @@_L1                 ; jmp L1
      @@_L4:
      mov word [bp - 4], 8      ; *(b{0}: int*2B) = store %8: char1B
      @@_L1:
      mov sp, bp
      pop bp
      ret
    `);
  });
});
