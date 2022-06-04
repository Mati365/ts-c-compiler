import {ccompiler, CCompilerOutput} from '@compiler/pico-c';

ccompiler(/* cpp */ `
  int sub(int a, int b) {
    int arr[] = { 1, 2, 3 };
    *(3 * 2 + arr + 2 - 1) = 3;
    *(arr + 3) = 3;
    a = 5 * 1 - 10;
    b -= a;
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
