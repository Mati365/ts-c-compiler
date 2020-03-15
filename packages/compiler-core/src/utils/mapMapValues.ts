/**
 * Iterates over map values and maps them
 *
 * @export
 * @template K key
 * @template V value
 * @template O output
 * @param {(v: V, k?: K) => V} fn
 * @param {Map<K, V>} map
 * @returns {Map<K, O>}
 */
export function mapMapValues<K, V, O>(
  fn: (v: V, k?: K) => O,
  map: Map<K, V>,
): Map<K, O> {
  const mapped = new Map<K, O>();

  for (const [key, val] of map) {
    const result = fn(val, key);

    if (result !== undefined)
      mapped.set(key, result);
  }

  return mapped;
}
