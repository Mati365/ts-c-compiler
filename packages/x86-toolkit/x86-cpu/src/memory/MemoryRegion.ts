/**
 * Simple interface that allows VirtualMemBlockDriver
 * to define driver, mem regions check and mappings.
 * It is used in GPU with 0xA0000 mem mappings
 */
export interface ByteMemRegionAccessor {
  writeByte(address: number, value: number): number;
  readByte(address: number): number;
}

/**
 * Defines simple vector that contains high and low mem address
 */
export class MemoryRegionRange {
  readonly size: number;

  constructor(public low: number, public high: number) {
    if (low > high) {
      [this.low, this.high] = [high, low];
    }

    this.size = this.high - this.low + 1;
  }

  /**
   * Check if address is in region
   */
  contains(address: number, margin: number = 0): boolean {
    const { low, high } = this;

    return address + margin >= low && address <= high;
  }

  /**
   * Check if region intersects with other region
   */
  intersects(range: MemoryRegionRange): boolean {
    const { low, high } = this;

    return range.low <= high && range.high >= low;
  }
}

export type MemoryRegionsMap = Readonly<Record<number, MemoryRegionRange>>;
