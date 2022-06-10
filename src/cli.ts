import {ccompiler, CCompilerOutput} from '@compiler/pico-c';

ccompiler(/* cpp */ `
  struct Vec2 {
    int x, y;
    struct Rect { int s, w; } k;
  };

  void main() {
    struct Vec2 vec[] = { { .y = 5 }, { .x = 2 } };
    struct Vec2 (*ptr)[] = &vec;
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
