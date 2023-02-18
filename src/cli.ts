import 'source-map-support/register';
import { ccompiler, CCompilerOutput } from '@compiler/pico-c';

ccompiler(/* cpp */ `
  void sum(int a, int b, int c) {
    int k = a + b + c;
  }
  void main() {
    sum(1, 2, 3);
  }
`).match({
  ok: result => {
    result.dump();
  },
  err: (error: any) => {
    if (error?.[0]?.tree) {
      console.info(CCompilerOutput.serializeTypedTree(error[0].tree));
    }

    console.error(error);
  },
});
