import {ccompiler, CCompilerOutput} from '@compiler/pico-c';

ccompiler(/* cpp */ `
  struct Point {
    int x, y;
    int dupa[10];
  };

  void main() {
    struct Point point[] = { { .y = 6 }, { .x = 2 } };
    point[1].dupa[2]++;
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
