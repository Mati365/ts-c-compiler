import {ccompiler, CCompilerOutput} from '@compiler/pico-c';

ccompiler(/* cpp */ `
  int sub(int a, int b) {
    int abc = a + b;
    int* rootPtr = &abc;
    int** ptr = &rootPtr;
    (**ptr) = 5;
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
