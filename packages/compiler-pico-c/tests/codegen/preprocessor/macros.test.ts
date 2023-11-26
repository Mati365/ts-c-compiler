import '../utils';

test('Macros', () => {
  expect(/* cpp */ `
    #define PRINT_SUM 1
    #define A 1
    #define B 1

    #define esum(...) sum(__VA_ARGS__)
    #define internal_fn(name) internal_ ## name

    #define min(a,b) ((a)<(b)?(a):(b))
    #define max(a,b) ((a)>(b)?(a):(b))
    #define sum(a,b) (min(a, b) + max(a, b))

    #ifdef PRINT_SUM
      #if A + B == 12 || A - B == 0
        int main() {
          int k = esum(10, 6);
        }
      #endif
    #elifdef ABC
      int s = 2;
    #elifndef DBEF
      struct Vec2 { int x, y; };

      struct Vec2 sum_vec(int k, struct Vec2 vec, int x) {
        struct Vec2 result = {
          .x = k + vec.x * vec.y - x,
          .y = vec.y * 3
        };

        return result;
      }

      int main() {
        struct Vec2 vec = { .x = 4, .y = 3 };
        struct Vec2 k = sum_vec(2, vec, 5);

        int d = k.x + k.y;
        asm("xchg dx, dx");
      }
    #else
      int internal_fn(main)() {
        int k = 2;
      }
    #endif
  `).toCompiledAsmBeEqual(`
    cpu 386
    ; def main(): [ret: int2B]
    @@_fn_main:
    push bp
    mov bp, sp
    sub sp, 2
    mov word [bp - 2], 16     ; *(k{0}: int*2B) = store %16: int2B
    mov sp, bp
    pop bp
    ret
  `);
});
