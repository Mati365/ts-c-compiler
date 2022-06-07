import {ccompiler, CCompilerOutput} from '@compiler/pico-c';

ccompiler(/* cpp */ `
  int main() {
    int d = 2;
    d = ++d + d++;
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
