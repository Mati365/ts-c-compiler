import 'source-map-support/register';
import {ccompiler, CCompilerOutput} from '@compiler/pico-c';

ccompiler(/* cpp */ `
  // struct Vec2 {
  //   int x, y;
  // };

  // struct Vec2 of_vec(int x, int y) {
  //   struct Vec2 v = { .x = x, .y = y };
  //   return v;
  // }

  // int main() {
  //   struct Vec2 (*ptr)(int, int) = of_vec;
  //   struct Vec2 vec = (*ptr + 1)(1, 2);
  // }
  int sum(int x, int y) {
    return x + y * 2 + 1 * 4 - 1;
  }
`).match(
  {
    ok: (result) => {
      result.dump();
    },
    err: (error: any) => {
      if (error?.[0]?.tree) {
        console.info(
          CCompilerOutput.serializeTypedTree(error[0].tree),
        );
      }

      console.error(error);
    },
  },
);
