import type { CCompilerArch } from '#constants';

import { CScopeTree } from 'frontend/analyze/scope';
import * as Defs from './defs';

export const createBuiltinAnalyzeScope = (arch: CCompilerArch): CScopeTree => {
  const tree = new CScopeTree({
    arch,
  });

  tree.defineTypes([
    new Defs.VA.CVaListBuiltinStruct({ arch }),
    new Defs.VA.CVaStartBuiltinFn({ arch }),
    new Defs.VA.CVaArgBuiltinFn({ arch }),
    new Defs.VA.CVaEndBuiltinFn({ arch }),
    new Defs.CAllocaBuiltinFn({ arch }),
  ]);

  return tree;
};
