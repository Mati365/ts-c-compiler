import 'source-map-support/register';
import { ccompiler, CCompilerOutput } from '@compiler/pico-c';
import { MOCK_C_FILE } from './shared';

ccompiler(MOCK_C_FILE).match({
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
