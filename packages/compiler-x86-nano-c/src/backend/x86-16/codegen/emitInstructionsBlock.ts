import {EmitterResult} from './emitInstruction';

/**
 * Merges multiple instructions into block
 *
 * @export
 * @param {InstructionsBlockEmitterConfig} config
 * @param {EmitterResult[]} results
 */
type InstructionsBlockEmitterConfig = {
  padLeft?: number,
  separator?: string,
};

export function emitInstructionsBlock(
  config: InstructionsBlockEmitterConfig,
  results: EmitterResult[],
) {
  const {
    separator = '\n',
    padLeft = 0,
  } = config || {};

  return (
    results
      .filter(Boolean)
      .map(
        ({code}) => code.padStart(padLeft, ' '),
      )
      .join(separator)
      .toLowerCase()
  );
}
