import * as E from 'fp-ts/Either';
import { pipe } from 'fp-ts/function';

import { CCompilerConfig, CCompilerArch } from '../constants/config';
import { CCompilerTimer, createCCompilerTimings } from './utils/createCCompilerTimings';

import { safePreprocess } from './preprocessor';
import { safeGenerateTree, clexer } from './parser';
import { safeBuildIRCode } from './ir';
import { safeBuildTypedTree, type ScopeTreeBuilderResult } from './analyze';

type IRCompilerConfig = CCompilerConfig & {
  timings?: CCompilerTimer;
};

export const cIRCompiler =
  (
    { timings = createCCompilerTimings(), ...ccompilerConfig }: IRCompilerConfig = {
      arch: CCompilerArch.X86_16,
      optimization: {
        enabled: true,
      },
    },
  ) =>
  (code: string) =>
    pipe(
      code,
      timings.chainIO('lexer', clexer(ccompilerConfig.lexer)),
      E.chain(
        timings.chainIO('preprocessor', safePreprocess(ccompilerConfig.preprocessor)),
      ),
      E.chainW(timings.chainIO('ast', safeGenerateTree)),
      E.chainW(timings.chainIO('analyze', safeBuildTypedTree(ccompilerConfig))),
      E.chainW(
        timings.chainIO(
          'analyze',
          ({ scope, ...analyzeResult }: ScopeTreeBuilderResult) =>
            pipe(
              scope,
              safeBuildIRCode(ccompilerConfig),
              E.map(ir => ({
                ...analyzeResult,
                scope,
                ir,
              })),
            ),
        ),
      ),
    );
