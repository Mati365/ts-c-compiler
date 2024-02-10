/**
 * Iterates over map values and maps them
 */
export function mapMapValues<K, V, O>(fn: (v: V, k?: K) => O, map: Map<K, V>): Map<K, O> {
  const mapped = new Map<K, O>();

  for (const [key, val] of map) {
    const result = fn(val, key);

    if (result !== undefined) {
      mapped.set(key, result);
    }
  }

  return mapped;
}
