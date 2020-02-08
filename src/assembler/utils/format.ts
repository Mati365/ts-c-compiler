import * as R from 'ramda';

export const INNER_ITEM_MATCH_REGEX: RegExp = /%{([?.\w]*)}/g; // match = 1

/**
 * Inserts into template string with %{} characters variables
 *
 * @example
 * "test ${}" => "test variableValue"
 *
 * @export
 * @param {string} str
 * @param {(object|Array<any>)} params
 * @returns {string}
 */
export function format(str: string, params: object|Array<any>): string {
  let counter = 0;

  return str.replace(
    INNER_ITEM_MATCH_REGEX,
    (_, match) => {
      if (R.is(String, match) && match.length)
        return params[match];

      return params[counter++];
    },
  );
}
