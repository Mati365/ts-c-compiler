import {ccompiler, CCompilerOutput} from '@compiler/pico-c';

ccompiler(/* cpp */ `
  void main() {
    // int** (*(*abc[3])[2])[4][5];
    // int* dupa[] = { 1, 2, 3, 4, 5 };
    // int (*p[3])[5];
    // int a[5][4][2];
    int a = 123;
    int* b = &a;
    int c = *b + 4;
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
