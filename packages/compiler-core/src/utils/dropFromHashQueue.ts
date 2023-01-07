export function dropFromHashQueue<K extends string | number, V>(
  uuid: K,
  obj: Record<K, V>,
) {
  const value = obj[uuid];
  delete obj[uuid];
  return value;
}
