import * as R from 'ramda';

/**
 * Remove child keys from parent keeping parent reference
 */
export function mutableOmitChildKeys(parent: object, child: object): object {
  R.forEach(key => {
    delete parent[key];
  }, R.keys(child));

  return parent;
}
