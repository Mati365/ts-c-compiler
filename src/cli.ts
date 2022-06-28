import 'source-map-support/register';
import {ccompiler, CCompilerOutput} from '@compiler/pico-c';

/**
 * TODO:
 * Wrong result of this code:
 *
 * struct Vec2 { int x; };
 * struct Vec2 sum(int a) {
 *  struct Vec2 out = { .x = a };
 *  return out;
 * }
 * void main() {
 *  struct Vec2 d = sum(2);
 * }
 */
ccompiler(/* cpp */ `
void main() {
    int x = 2;
    x++;

    if (1) {
      int *x = *x;
      int d = *x + 5;
    }
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
