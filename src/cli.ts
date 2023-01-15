import 'source-map-support/register';
import { ccompiler, CCompilerOutput } from '@compiler/pico-c';

ccompiler(/* cpp */ `
  void main() {
    int a = 6;
    int k = 6;

    if (a > 5 || a < 2) {
      int k = 5;
    } else if (a * k > 5) {
      int d = 5;
    }

    while (a > 5) {
      int s = a;
    }
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
