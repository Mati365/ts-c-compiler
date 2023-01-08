import { ok } from '@compiler/core/monads/Result';

import {
  CCompilerTimer,
  createCCompilerTimings,
} from './utils/createCCompilerTimings';
import { CCompilerConfig, CCompilerArch } from '../constants/config';

import { safeGenerateTree, clexer } from './parser';
import { safeBuildIRCode } from './ir';
import { safeBuildTypedTree } from './analyze';

type IRCompilerConfig = CCompilerConfig & {
  timings?: CCompilerTimer;
};

export function cIRCompiler(
  code: string,
  {
    timings = createCCompilerTimings(),
    ...ccompilerConfig
  }: IRCompilerConfig = {
    arch: CCompilerArch.X86_16,
    optimization: {
      enabled: true,
    },
  },
) {
  return timings
    .add('lexer', clexer)(ccompilerConfig.lexer, code)
    .andThen(timings.add('ast', safeGenerateTree))
    .andThen(
      timings.add('analyze', tree => safeBuildTypedTree(ccompilerConfig, tree)),
    )
    .andThen(
      timings.add('ir', result =>
        safeBuildIRCode(ccompilerConfig, result.scope).andThen(ir =>
          ok({
            ir,
            ...result,
          }),
        ),
      ),
    );
}
