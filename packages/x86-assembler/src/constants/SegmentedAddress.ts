export class SegmentedAddress {
  constructor(
    public offset: number,
    public segment: number,
  ) {}

  toString() {
    const { offset, segment } = this;

    return `${offset.toString(16)}:${segment.toString(16)}`;
  }

  static ofExtendedFlatAddress(num: number) {
    return new SegmentedAddress(num & 0xffff, (num >> 0x10) & 0xffff);
  }
}
