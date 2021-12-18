/**
 * Generates random ID based on time
 *
 * @export
 * @param {string} [prefix='']
 * @param {string} [postfix='']
 * @returns {string}
 */
export function genUUID(prefix: string = '', postfix: string = ''): string {
  const randomNum = (
    +(Math.random().toString().slice(2))
    + Date.now()
  ).toString(36);

  return `${prefix}${randomNum}${postfix}`;
}
