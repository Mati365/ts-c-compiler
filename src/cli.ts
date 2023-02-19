import 'source-map-support/register';
import { ccompiler, CCompilerOutput } from '@compiler/pico-c';

ccompiler(/* cpp */ `
  // todo:
  // sprawdź co ładuje do: int k =0x6; char i = k;
  // mamy little endian!

  struct Vec2 {
    int x, y;
  };
    struct Vec2 of_vec(int x, int y) {
    struct Vec2 v = { .x = x, .y = y };
    return v;
    }
    // int main() {
    // struct Vec2 out = of_vec(2, 3);
    // out.x = 1;
    // out.y = 7;
    // }

  // struct Vec2 {
  //   int x, y;
  // };

  // int sum_vec(struct Vec2 vec) {
  //   return  vec.x + vec.y;
  // }

  // int main() {
    // struct Vec2 vec = { .x = 1, .y = 3 };
    // int k = vec.x;
    // vec.x = 3;
    // sum_vec(vec);
  // }
  // void main() {
  //   struct Vec2 vec = { .x = 1, .y = 3 };
  //   int k = vec.x + vec.y;
  // }
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
