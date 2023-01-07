/**
 * Compares only first level of object keys
 */
export function shallowDiffers(a: any, b: any): boolean {
  if (a === b) {
    return false;
  }

  if (a instanceof Object && b instanceof Object) {
    for (const i in a) {
      if (!(i in b)) {
        return true;
      }
    }

    for (const i in b) {
      if (a[i] !== b[i]) {
        return true;
      }
    }

    return false;
  }

  return true;
}
