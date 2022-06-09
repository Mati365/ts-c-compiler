import {ccompiler, CCompilerOutput} from '@compiler/pico-c';

ccompiler(/* cpp */ `
  struct Point {
    int x, y;

    struct Nested {
      int w;
    } nested;
  };

  void main() {
    const char* str = "hello world";
    int numbers[] = { 1, 2, 3 };

    struct Point points[] = {
      {
        .x = 4,
        .nested = {
          .w = 6
        },
      },
    };

    int* a = &points[0].x;
    (*a)++;
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
