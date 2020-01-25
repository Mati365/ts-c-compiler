import * as R from 'ramda';

/**
 * Returns first matching group of regex
 *
 * @param {Regex} regex
 * @param {String} str
 *
 * @returns {String} first match
 */
const safeFirstMatch = regex => R.compose(
  (output) => {
    if (!output || !output.length)
      return null;

    return R.defaultTo(output[2], output[1]);
  },
  R.match(regex),
);

export default safeFirstMatch;
