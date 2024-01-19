import '../utils';

describe('Alloca', () => {
  test('basic alloca call with constant arg', () => {
    expect(/* cpp */ `
      #include <alloca.h>

      int main() {
        char* buffer = (char*) alloca(10 + 10);
        return 0;
      }
    `).toCompiledAsmBeEqual(`
      cpu 386
      ; def main(): [ret: int2B]
      @@_fn_main:
      push bp
      mov bp, sp
      sub sp, 2
      sub sp, 20
      mov ax, sp
      mov word [bp - 2], ax     ; *(buffer{0}: char**2B) = store %t{3}: char*2B
      mov ax, word 0
      mov sp, bp
      pop bp
      ret
    `);
  });

  test('basic alloca call with variable arg', () => {
    expect(/* cpp */ `
      #include <alloca.h>

      int main() {
        int k = 10;
        char* buffer = alloca(k);
        return 0;
      }
    `).toCompiledAsmBeEqual(`
      cpu 386
      ; def main(): [ret: int2B]
      @@_fn_main:
      push bp
      mov bp, sp
      sub sp, 4
      mov word [bp - 2], 10     ; *(k{0}: int*2B) = store %10: int2B
      sub sp, word [bp - 2]
      mov ax, sp
      mov word [bp - 4], ax     ; *(buffer{0}: char**2B) = store %t{2}: char*2B
      mov ax, word 0
      mov sp, bp
      pop bp
      ret
    `);
  });
});
