/**
 * Iterates over map keys and executes fn on key name.
 * Outputs with object with mapped keys names
 */
export function mapObjectKeys<K extends {}>(
  fn: (key: string) => string,
  obj: K,
): K {
  const newObj: K = <any>{};

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      newObj[fn(key)] = obj[key];
    }
  }

  return newObj;
}
