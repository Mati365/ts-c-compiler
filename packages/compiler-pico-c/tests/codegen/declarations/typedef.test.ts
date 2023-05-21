import '../utils';

describe('Typedef declaration', () => {
  test('typedef int i;', () => {
    expect(/* cpp */ `
      typedef int i;

      void main() {
        i abc = 2;
      }
    `).toCompiledAsmBeEqual(`
      cpu 386
      ; def main():
      @@_fn_main:
      push bp
      mov bp, sp
      sub sp, 2
      mov word [bp - 2], 2      ; *(abc{0}: int*2B) = store %2: int2B
      mov sp, bp
      pop bp
      ret
    `);
  });

  test('typedef int vec3_t[3]', () => {
    expect(/* cpp */ `
      typedef int vec3_t[3];

      int main() {
        vec3_t x;
        x[0] = 2;
        x[1] = 3;
        x[2] = 4;
      }
    `).toCompiledAsmBeEqual(`
      cpu 386
      ; def main(): [ret: int2B]
      @@_fn_main:
      push bp
      mov bp, sp
      sub sp, 6
      mov word [bp - 6], 2      ; *(x{0}: int[3]*2B) = store %2: char1B
      mov word [bp - 4], 3      ; *(x{0}: int[3]*2B + %2) = store %3: char1B
      mov word [bp - 2], 4      ; *(x{0}: int[3]*2B + %4) = store %4: char1B
      mov sp, bp
      pop bp
      ret
    `);
  });

  test('typedef struct without def', () => {
    expect(/* cpp */ `
      struct Vec2 {
        char x, y;
      };

      typedef struct Vec2 vec2_t;

      int main() {
        vec2_t vec = { .y = 6 };
      }
    `).toCompiledAsmBeEqual(`
      cpu 386
      ; def main(): [ret: int2B]
      @@_fn_main:
      push bp
      mov bp, sp
      sub sp, 2
      mov byte [bp - 1], 6      ; *(vec{0}: struct Vec2*2B + %1) = store %6: char1B
      mov sp, bp
      pop bp
      ret
    `);
  });

  test('typedef with inline def', () => {
    expect(/* cpp */ `
      typedef struct Vec2 {
        char x, y;
      } vec2_t;

      int main() {
        vec2_t vec = { .y = 6 };
      }
    `).toCompiledAsmBeEqual(`
      cpu 386
      ; def main(): [ret: int2B]
      @@_fn_main:
      push bp
      mov bp, sp
      sub sp, 2
      mov byte [bp - 1], 6      ; *(vec{0}: struct Vec2*2B + %1) = store %6: char1B
      mov sp, bp
      pop bp
      ret
    `);
  });

  test('multiple variables use the same typedef', () => {
    expect(/* cpp */ `
      typedef struct Vec2 {
        int x, y;
      } vec2_t;

      void main() {
        vec2_t a = { .x = 1, .y  = 2};
        vec2_t b = { .x = 4 };
      }
    `).toCompiledAsmBeEqual(`
      cpu 386
      ; def main():
      @@_fn_main:
      push bp
      mov bp, sp
      sub sp, 8
      mov word [bp - 4], 1      ; *(a{0}: struct Vec2*2B) = store %1: int2B
      mov word [bp - 2], 2      ; *(a{0}: struct Vec2*2B + %2) = store %2: int2B
      mov word [bp - 8], 4      ; *(b{0}: struct Vec2*2B) = store %4: int2B
      mov sp, bp
      pop bp
      ret
    `);
  });
});
