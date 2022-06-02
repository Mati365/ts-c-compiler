import {ccompiler, CCompilerOutput} from '@compiler/pico-c';

ccompiler(/* cpp */ `
  int sum(int a, int b) {
    int abc = (a = b = a * 2 + 12 * 4 / 2), dupa = 666;
  }

  struct Vec2 {
    int x, y;
  };

  int sub(int a, int b) {
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
