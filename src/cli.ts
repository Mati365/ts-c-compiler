import 'source-map-support/register';

import { ccompiler } from '@compiler/pico-c';
import { serializeTypedTreeToString } from '@compiler/pico-c/frontend/parser';

import { MOCK_C_FILE } from './shared';

ccompiler(MOCK_C_FILE).match({
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
