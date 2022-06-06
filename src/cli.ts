import {ccompiler, CCompilerOutput} from '@compiler/pico-c';

ccompiler(/* cpp */ `
  int sub(int a, int b) {
    char dynamicArray[] = { a + b, 2 };
    char array[10] = { 1, 2 };
    char array2[10] = { 1, 2, 3, 4, 5, 6 };
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
