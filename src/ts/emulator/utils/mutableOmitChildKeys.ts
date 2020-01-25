import * as R from 'ramda';

/**
 * Remvoe child keys from parent keeping parent reference
 *
 * @param {object} parent
 * @param {object} child
 * @returns {object}
 */
export function mutableOmitChildKeys(parent: object, child: object): object {
  R.forEach(
    (key) => {
      delete parent[key];
    },
    R.keys(child),
  );

  return parent;
}
