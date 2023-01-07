import * as R from 'ramda';

/**
 * Returns first matching group of regex
 */
export const safeFirstMatch = R.curry((regex: RegExp, str: string): string => {
  const output = R.match(regex, str);

  if (!output || !output.length) {
    return null;
  }

  return R.defaultTo(output[2], output[1]);
});
