/**
 * Flips value with key in Map
 *
 * @template Key
 * @template Value
 * @param {Map<K, V>} map
 * @returns {Map<K, V>}
 */
export function flipMap<K, V>(map: Map<K, V>): Map<V, K> {
  const flipped = new Map<V, K>();
  for (const [key, val] of map)
    flipped.set(val, key);

  return flipped;
}
