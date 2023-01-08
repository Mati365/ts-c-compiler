import { createTiming } from '@compiler/core/utils/createTiming';

/**
 * Create pack that measures
 */
export function createCCompilerTimings() {
  return createTiming({
    lexer: 0,
    ast: 0,
    analyze: 0,
    ir: 0,
    codegen: 0,
  });
}

export type CCompilerTimer = ReturnType<typeof createCCompilerTimings>;
export type CCompilerTimings = ReturnType<
  ReturnType<typeof createCCompilerTimings>['unwrap']
>;
