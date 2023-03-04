import 'source-map-support/register';
import { ccompiler, CCompilerOutput } from '@compiler/pico-c';

ccompiler(/* cpp */ `
  // void main() {
  //   // fixme ternary: int b = a > 4 ? 4 : 1;
  //   int a = 14;

  //   // fixme: should return 1 to b
  //   int b = a > 3 && 0;
  //   asm("xchg dx, dx");
  // }
  void main() {
    int a = 14;
    int b = a > 3 && 0;
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
