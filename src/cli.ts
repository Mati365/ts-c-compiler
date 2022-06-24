import 'source-map-support/register';
import {ccompiler, CCompilerOutput} from '@compiler/pico-c';

ccompiler(/* cpp */ `
  int sum(int x, int y) {
    return x + y;
  }
  void main() {
    int (*fun_ptr)(int, int) = sum;
    int (*fun_ptr2)(int, int) = &sum;
    fun_ptr2 = sum;
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
