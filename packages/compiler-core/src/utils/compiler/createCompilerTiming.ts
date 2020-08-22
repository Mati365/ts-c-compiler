import {createTiming} from '../createTiming';

/**
 * Create pack that measures
 *
 * @export
 * @returns
 */
export function createCompilerTimings() {
  return createTiming(
    {
      preprocessor: 0,
      lexer: 0,
      ast: 0,
      compiler: 0,
    },
  );
}

export type CompilerTimings = ReturnType<ReturnType<typeof createCompilerTimings>['unwrap']>;
