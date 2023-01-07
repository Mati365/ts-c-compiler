/**
 * Flips value with key in Map
 */
export function flipMap<K, V>(map: Map<K, V>): Map<V, K> {
  const flipped = new Map<V, K>();
  for (const [key, val] of map) {
    flipped.set(val, key);
  }

  return flipped;
}
