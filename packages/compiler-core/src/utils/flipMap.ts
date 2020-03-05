/**
 * Flips value with key in Map
 *
 * @template Key
 * @template Value
 * @param {Map<Key, Value>} map
 * @returns {Map<Value, Key>}
 */
export function flipMap<Key, Value>(map: Map<Key, Value>): Map<Value, Key> {
  const flipped = new Map<Value, Key>();
  for (const [key, val] of map)
    flipped.set(val, key);

  return flipped;
}
