import {ccompiler, CCompilerOutput} from '@compiler/pico-c';

ccompiler(/* cpp */ `
  struct Vec2 {
    int x, y;
  };

  int sub(int a, int b) {
    a = 5;
    int* d = &a;
    (*d) = 2;

    int array[] = { 4 + *d, 66, 11, 21, 32, 11, 'a' };
    struct Vec2 vec[] = { { .x = 5 }, { .y = 6 }, { .x = 1, .y = 666 }};
    int* ptr = &vec[2].y;
    (*ptr) = 7;
    *(array + 2) = 77;
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
