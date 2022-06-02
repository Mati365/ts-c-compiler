import {ccompiler, CCompilerOutput} from '@compiler/pico-c';

ccompiler(/* cpp */ `
  struct Vec2 {
    int x, y;
  };

  int sum(int a, int b) {
    int array2[] = { 1, 2, 3, 4 };
    struct Vec2 array[] = { { .x = 5 }, { .y = 3 } };

    int sum2 = array[0].x + array[1].y;
    int sum = 3 * 4 / 2 + (sum2 + 1);
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
