import 'source-map-support/register';
import { ccompiler, CCompilerOutput } from '@compiler/pico-c';

ccompiler(/* cpp */ `
  void sum() {
    int i = 0;
    i = i + 1 + i + (3 * 4);

    if (i > 5) {
      int k;

      k = 5 + i;
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
