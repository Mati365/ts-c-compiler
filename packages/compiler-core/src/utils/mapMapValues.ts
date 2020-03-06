/**
 * Iterates over map values and maps them
 *
 * @export
 * @template Key
 * @template Value
 * @template OutputValue
 * @param {(v: Value, k?: Key) => OutputValue} fn
 * @param {Map<Key, Value>} map
 * @returns {Map<Key, OutputValue>}
 */
export function mapMapValues<Key, Value, OutputValue>(
  fn: (v: Value, k?: Key) => OutputValue,
  map: Map<Key, Value>,
): Map<Key, OutputValue> {
  const mapped = new Map<Key, OutputValue>();
  for (const [key, val] of map)
    mapped.set(key, fn(val, key));

  return mapped;
}
