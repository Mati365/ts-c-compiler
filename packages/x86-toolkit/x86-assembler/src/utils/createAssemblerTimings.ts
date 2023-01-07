import { createTiming } from '@compiler/core/utils/createTiming';

/**
 * Create pack that measures
 */
export function createAssemblerTimings() {
  return createTiming({
    preprocessor: 0,
    lexer: 0,
    ast: 0,
    compiler: 0,
  });
}

export type AssemblerTimings = ReturnType<
  ReturnType<typeof createAssemblerTimings>['unwrap']
>;
