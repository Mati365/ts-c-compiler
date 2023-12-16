import type { CCompilerArch } from '#constants';

import { CScopeTree } from 'frontend/analyze/scope';
import * as VA from './va';

export const createBuiltinAnalyzeScope = (arch: CCompilerArch): CScopeTree => {
  const tree = new CScopeTree({
    arch,
  });

  tree.defineTypes([
    new VA.CVaListBuiltinStruct({ arch }),
    new VA.CVaStartBuiltinFn({ arch }),
  ]);

  return tree;
};
