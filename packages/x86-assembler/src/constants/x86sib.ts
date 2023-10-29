/**
 * Scale index byte, used in addressing in 32mode
 */
export class SibByte {
  constructor(
    public scale: number,
    public index: number,
    public base: number,
  ) {}

  get byte() {
    const { scale, index, base } = this;

    return (scale & 0b111) | ((index & 0b111) << 0x3) | ((base & 0b11) << 0x6);
  }

  /**
   * @see {@link http://www.swansontec.com/sintel.html}
   */
  static ofByte(byte: number) {
    return new SibByte(
      (byte & 0xc0) >> 0x6, // scale
      (byte & 0x38) >> 0x3, // index
      byte & 0x7, // base
    );
  }
}
