import {EmitterResult} from '../constants/types';

type InstructionsBlockGeneratorConfig = {
  padLeft?: number,
  separator?: string,
};

export function genInstructionsBlock(
  config: InstructionsBlockGeneratorConfig,
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
