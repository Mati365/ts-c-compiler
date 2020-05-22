import {X86BitsMode} from '../types/X86Regs';

/**
 * Simple interface that allows VirtualMemBlockDriver
 * to define driver, mem regions check and mappings.
 * It is used in GPU with 0xA0000 mem mappings
 *
 * @export
 * @interface ByteMemAccessor
 */
export interface ByteMemRegionAccessor {
  writeUInt(address: number, value: number, bits: X86BitsMode): number;
  readUInt(address: number, bits: X86BitsMode): number;
}

/**
 * Defines simple vector that contains high and low mem address
 *
 * @export
 * @class MemoryRegion
 */
export class MemoryRegionRange {
  public readonly size: number;

  constructor(
    public readonly low: number,
    public readonly high: number,
  ) {
    this.size = high - low;
  }

  /**
   * Check if address is in region
   *
   * @param {number} address
   * @param {number} [bits=0]
   * @returns {boolean}
   * @memberof MemoryRegionRange
   */
  contains(address: number, margin: number = 0): boolean {
    const {low, high} = this;

    return address + margin >= low && address <= high;
  }
}

export type MemoryRegionsMap = Readonly<{[key: number]: MemoryRegionRange}>;
