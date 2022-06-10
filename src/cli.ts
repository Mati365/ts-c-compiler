import {ccompiler, CCompilerOutput} from '@compiler/pico-c';

ccompiler(/* cpp */ `
  // struct Vec2 {
  //   int x, y;
  //   struct Rect { int s, w; } k;
  // };

  // void main() {
  //   struct Vec2 vec[] = { { .y = 5 }, { .x = 2 } };

  //   vec[1].y = 7;
  //   vec[0].k.w = 2;

  //   struct Vec2 (*ptr)[] = &vec;
  //   ptr->
  // }
  void main() {
    int arr[] = { 1, 2, 3, 4, 5, 6 };
    int* ptr = arr;
    ptr[2] = 2 *4;
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
