/**
 * Concat array of numbers into single digit
 */
export function mergeNumberBytes(num: number[]): number {
  let acc = 0;
  for (let i = 0; i < num.length; ++i) {
    acc = (acc << 0x8) | num[i];
  }

  return acc;
}
