import {ccompiler, CCompilerOutput} from '@compiler/pico-c';

ccompiler(/* cpp */ `
  int sum() {
    int a[3][2] = { { 1, 2 }, { 2, 3 }, { 4, 5 } };
    int k = 1;
    int c = a[k + 1][1];
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
