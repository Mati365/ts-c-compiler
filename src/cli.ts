import 'source-map-support/register';
import {ccompiler, CCompilerOutput} from '@compiler/pico-c';

ccompiler(/* cpp */ `
  int sum(int a, int b) {
    return a + b;
  }

  void main() {
    // (sum + 3)(2, 3);
    sum(2, 3);
    // int* ptr = 0;
    // (*ptr)(2, 3);
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
