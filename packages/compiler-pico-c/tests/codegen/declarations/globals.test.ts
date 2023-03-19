import '../utils';

describe('Global variables declaration', () => {
  test('can read primitive global variable', () => {
    expect(/* cpp */ `
      int j;

      void main() {
        int k = j;
      }
    `).toCompiledAsmBeEqual(`
      cpu 386
      ; def main():
      @@_fn_main:
      push bp
      mov bp, sp
      sub sp, 2
      mov ax, [@@_c_0_]
      mov word [bp - 2], ax     ; *(k{0}: int*2B) = store %t{0}: int*2B
      mov sp, bp
      pop bp
      ret

      @@_c_0_: db 0, 0
    `);
  });

  test('can write primitive global variable', () => {
    expect(/* cpp */ `
      int j;

      void main() {
        j = 8;
      }
    `).toCompiledAsmBeEqual(`
      cpu 386
      ; def main():
      @@_fn_main:
      push bp
      mov bp, sp
      mov word [@@_c_0_], 8     ; *(%t{0}: int*2B) = store %8: char1B
      mov sp, bp
      pop bp
      ret

      @@_c_0_: db 0, 0
    `);
  });
});
