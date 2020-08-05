import {createTiming} from '../createTiming';

export type CompilerTimings = {
  preprocessor: number,
  lexer: number,
  ast: number,
  compiler: number,
};

/**
 * Create pack that measures
 *
 * @export
 * @returns
 */
export function createCompilerTimings() {
  return createTiming<CompilerTimings>(
    {
      preprocessor: 0,
      lexer: 0,
      ast: 0,
      compiler: 0,
    },
  );
}
