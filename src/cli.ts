import 'source-map-support/register';
import { ccompiler, CCompilerOutput } from '@compiler/pico-c';

ccompiler(/* cpp */ `
  void main() {
    int a = 2;
    int b = a + a;
    int c = b * 2;
    int d = c + b + a + (1 + 3) / 2;
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
