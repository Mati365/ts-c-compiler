import 'source-map-support/register';
import { ccompiler, CCompilerOutput } from '@compiler/pico-c';

ccompiler(/* cpp */ `
  struct Vec2 {
    int x, y;
  };

  int sum_vec(struct Vec2 vec, struct Vec2 vec2) {
    return vec.x + vec.y;
  }

  int main() {
    struct Vec2 vec = { .x = 1, .y = 3 };
    sum_vec(vec, vec);
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
