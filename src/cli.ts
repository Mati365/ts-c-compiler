import 'source-map-support/register';
import { ccompiler, CCompilerOutput } from '@compiler/pico-c';

ccompiler(/* cpp */ `
  // todo:
  // 1. branching RVO
  // 2. sprawdź co ładuje do: int k =0x6; char i = k;
  //    mamy little endian!
  struct Vec2 {
    int x, y;
    char c;
  };

  // todo: not work
  struct Vec2 of(int x, int y) {
    if (x > y) {
      struct Vec2 a = { .x = 1, .y = 2 };
      return a;
    }

    struct Vec2 b = { .x = 3, .y = 4 };
    return b;
  }

  int main() {
    struct Vec2 out = of(2, 3);
    out.x = 1;
    out.y = 7;
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
