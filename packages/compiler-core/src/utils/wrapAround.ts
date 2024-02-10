/**
 * @example
 *  wrapAround(10, -1) => 9
 *  wrapAround(10, 1) => 1
 */
export const wrapAround = (max: number, value: number) => ((value % max) + max) % max;
