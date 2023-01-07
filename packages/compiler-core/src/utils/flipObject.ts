/**
 * Flips keys with values
 */
export function flipObject(obj: Object): Object {
  const flipped: Object = {};

  for (const [key, val] of Object.entries(obj)) {
    flipped[val] = key;
  }

  return flipped;
}
