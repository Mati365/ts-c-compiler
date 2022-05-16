import {ccompiler, CCompilerOutput} from '@compiler/pico-c';

ccompiler(
  /* cpp */ `
    int main() {
      if (3 > 2) {}
    }
  `,
).match(
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
