import {ccompiler, CCompilerOutput} from '@compiler/pico-c';

ccompiler(/* cpp */ `
  struct Vec2 {
    int x, y;
  };

  int sum(int a, int b) {
    int sum = 1;
    sum += 5;
    sum *= 4 + 5 + 1 + (a * 4) + (b / 2);

    struct Vec2 vec2 = { .x = 5, .y = 4 };
    vec2.y = 15;

    int array[2][2] = { { 1, 2 }, { 3, 4 } };
    array[1][1] = 5 * vec2.y + (6 * 30 - vec2.x);
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
