import 'source-map-support/register';
import { ccompiler, CCompilerOutput } from '@compiler/pico-c';

ccompiler(/* cpp */ `
  // todo:
  // struct Vec2 {
  //   int x, y;
  //   char c;
  // };

  // todo: not work
  // struct Vec2 of(int x, int y) {
  //   if (x > y) {
  //     struct Vec2 a = { .x = 1, .y = 2 };
  //     return a;
  //   }

  //   struct Vec2 b = { .x = 3, .y = 4 };
  //   return b;
  // }

  // int main() {
  //   struct Vec2 out = of(2, 3);
  //   out.x = 1;
  //   out.y = 7;
  // }
  int strlen(const char* str) {
        for (int i = 0;;++i) {
          if (*(str + i) == 0) {
            return i;
          }
        }

        return 0;
      }

      int sum(int a, int b) {
        return a + b;
      }

      int max(int a, int b) {
        if (a > b) {
          return a;
        }

        return b;
      }

      int min(int a, int b) {
        if (b > a) {
          return a;
        }

        return b;
      }

      struct Vec2 {
        int x, y, z, w;
      };

      struct Vec2 make_vec(int a, int b) {
        struct Vec2 v = { .x = a * 2, .y = b };
        return v;
      }

      int magic_shit() {
        struct Vec2 v = make_vec(6, 2);
        int k = v.x + v.y;
        int length = sum(2, 3) + strlen("Hello world!") + sum(5, 5) + max(1, 2) + min(10, 1) + k;
        int j = 66;

        if (v.x + v.y > 10) {
          j += 2 + k;
        }

        if (length == 44) {
          j += 2;
        }

        return j;
      }

      void main() {
        int k = magic_shit() * 2;
      }
`).match({
  ok: result => {
    result.dump();
  },
  err: (error: any) => {
    if (error?.[0]?.tree) {
      console.info(CCompilerOutput.serializeTypedTree(error[0].tree));
    }

    console.error(error);
  },
});
