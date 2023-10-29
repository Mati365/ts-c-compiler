// import { program } from 'commander';

// program.option('-o, --output <string>');

import 'source-map-support/register';

import { ccompiler, serializeTypedTreeToString } from '@ts-c/compiler';

ccompiler(`
  void main() {
    int k = 2;
  }
`).match({
  ok: result => {
    result.dump();
  },
  err: (error: any) => {
    if (error?.[0]?.tree) {
      console.info(serializeTypedTreeToString(error[0].tree));
    }

    console.error(error);
  },
});
