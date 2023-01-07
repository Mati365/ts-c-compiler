/**
 * Fast append to map array, if array on key not exists - create
 */
export function appendToMapKeyArray<K, V>(
  keyName: K,
  item: V,
  map: Map<K, V[]>,
): void {
  const prevArray: V[] = map.get(keyName) || [];
  prevArray.push(item);
  map.set(keyName, prevArray);
}
