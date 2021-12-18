/**
 * Convert a JavaScript number to IEEE-754 Double Precision
 * value represented as an array of 8 bytes (octets)
 *
 * @see {@link http://cautionsingularityahead.blogspot.com/2010/04/javascript-and-ieee754-redux.html}
 *
 * @param {number} v
 * @param {number} ebits
 * @param {number} fbits
 * @returns {number[]}
 */
export function toIEEE754(v: number, ebits: number, fbits: number): number[] {
  const bias = (1 << (ebits - 1)) - 1;
  const extendedPrecision = ebits === 15 && fbits === 63;

  // Compute sign, exponent, fraction
  let s: number | boolean,
    e: number,
    f: number;

  if (Number.isNaN(v)) {
    e = (1 << bias) - 1; f = 1; s = 0;
  } else if (v === Infinity || v === -Infinity) {
    e = (1 << bias) - 1; f = 0; s = (v < 0) ? 1 : 0;
  } else if (v === 0) {
    e = 0; f = 0; s = (1 / v === -Infinity) ? 1 : 0;
  } else {
    s = v < 0;
    v = Math.abs(v);

    if (v >= 2 ** (1 - bias)) {
      const ln = Math.min(Math.floor(Math.log(v) / Math.LN2), bias);

      e = ln + bias;
      f = v * (2 ** (fbits - ln)) - (2 ** fbits);
    } else {
      e = 0;
      f = v / (2 ** (1 - bias - fbits));
    }
  }

  // Pack sign, exponent, fraction
  let i: number;
  const bits: number[] = [];

  for (i = fbits; i; i -= 1) { bits.push(f % 2 ? 1 : 0); f = Math.floor(f / 2); }

  // integer part in extended precision
  if (extendedPrecision)
    bits.push(1);

  for (i = ebits; i; i -= 1) { bits.push(e % 2 ? 1 : 0); e = Math.floor(e / 2); }
  bits.push(s ? 1 : 0);
  bits.reverse();
  let str = bits.join('');

  // Bits to bytes
  const bytes = [];
  while (str.length) {
    bytes.push(parseInt(str.substring(0, 8), 2));
    str = str.substring(8);
  }

  return bytes;
}

/**
 * Converts digit from IEEE754
 *
 * @param {number[]} bytes
 * @param {number} ebits
 * @param {number} fbits
 * @returns {number}
 */
export function fromIEEE754(bytes: number[], ebits: number, fbits: number): number {
  // Bytes to bits
  const extendedPrecision = ebits === 15 && fbits === 63;
  const bits = [];

  for (let i = bytes.length; i; i -= 1) {
    let byte = bytes[i - 1];

    for (let j = 8; j; j -= 1) {
      // integer part in extended precision
      if (extendedPrecision && i === 3 && j === 8)
        continue;

      bits.push(byte % 2 ? 1 : 0);
      byte >>= 1;
    }
  }

  bits.reverse();

  const str = bits.join('');

  // Unpack sign, exponent, fraction
  const bias = (1 << (ebits - 1)) - 1;
  const s = parseInt(str.substring(0, 1), 2) ? -1 : 1;
  const e = parseInt(str.substring(1, 1 + ebits), 2);
  const f = parseInt(str.substring(1 + ebits), 2);

  // Produce number
  if (e === (1 << ebits) - 1)
    return f !== 0 ? NaN : s * Infinity;

  if (e > 0)
    return s * (2 ** (e - bias)) * (1 + f / (2 ** fbits));

  if (f !== 0)
    return s * (2 ** (-(bias - 1))) * (f / (2 ** fbits));

  return s * 0;
}

export function fromIEEE754Extended(b: number[]): number { return fromIEEE754(b, 15, 63); }
export function toIEEE754Extended(v: number): number[] { return toIEEE754(v, 15, 63); }

export function fromIEEE754Double(b: number[]): number { return fromIEEE754(b, 11, 52); }
export function toIEEE754Double(v: number): number[] { return toIEEE754(v, 11, 52); }

export function fromIEEE754Single(b: number[]): number { return fromIEEE754(b, 8, 23); }
export function toIEEE754Single(v: number): number[] { return toIEEE754(v, 8, 23); }
