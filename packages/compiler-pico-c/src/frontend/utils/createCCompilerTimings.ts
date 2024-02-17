import { createTiming } from '@ts-cc/core';

/**
 * Create pack that measures
 */
export const createCCompilerTimings = () =>
  createTiming({
    lexer: 0,
    preprocessor: 0,
    ast: 0,
    analyze: 0,
    ir: 0,
    codegen: 0,
  });

export type CCompilerTimer = ReturnType<typeof createCCompilerTimings>;
export type CCompilerTimings = ReturnType<
  ReturnType<typeof createCCompilerTimings>['unwrap']
>;
