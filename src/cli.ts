import 'source-map-support/register';
import { ccompiler, CCompilerOutput } from '@compiler/pico-c';

ccompiler(/* cpp */ `
  struct Vec2 {
    int x, y;
  };

  void inc(struct Vec2* vec, int k) {
    vec->y += 3 + k;
    vec->y--;
  }

  int main() {
    int a = 1;
    struct Vec2 vec = { .x = 5, .y = 11 };
    inc(&vec, 10);

    a = vec.y;
    asm('xchg dx, dx');
    return a;
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
