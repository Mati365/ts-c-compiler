import {ccompiler, CCompilerOutput} from '@compiler/pico-c';

ccompiler(/* cpp */ `
  struct Vec2 {
    int x, y;
    char z;
  };

  int sum(int a, int b) {
    struct Vec2 array[2][] = { 1, 2, 230 };
    struct Vec2 vec = { 1, 2, 'a' };
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
