import {UnionStruct, bits} from '@compiler/core/shared/UnionStruct';
import {MemoryRegionRange} from '@emulator/x86-cpu/memory/MemoryRegion';
import {CHARSET_MEMORY_MAPS} from './VGAConstants';

/**
 * @see {@link http://www.osdever.net/FreeVGA/vga/seqreg.htm}
 *
 * Index 00h -- Reset Register
 * Index 01h -- Clocking Mode Register
 * Index 02h -- Map Mask Register
 * Index 03h -- Character Map Select Register
 * Index 04h -- Sequencer Memory Mode Register
 */

/**
 * Reset Register (Index 00h)
 *
 * @export
 * @class ResetReg
 * @extends {UnionStruct}
 */
export class ResetReg extends UnionStruct {
  @bits(0) ar: number;
  @bits(1) sr: number;
}

/**
 * Clocking Mode Register (Index 01h)
 *
 * @export
 * @class ClockingModeReg
 * @extends {UnionStruct}
 */
export class ClockingModeReg extends UnionStruct {
  @bits(0) dotMode8or9: number;
  @bits(2) slr: number;
  @bits(3) dcr: number;
  @bits(4) s4: number;
  @bits(5) sd: number;
}

/**
 * Map Mask Register (Index 02h)
 *
 * @export
 * @class MapMaskReg
 * @extends {UnionStruct}
 */
export class MapMaskReg extends UnionStruct {
  @bits(0, 3) memPlaneWriteEnable: number;
}

/**
 * Character Map Select Register (Index 03h)
 *
 * @export
 * @class CharMapSelectReg
 * @extends {UnionStruct}
 */
export class CharMapSelectReg extends UnionStruct {
  @bits(0, 1) charSetBSelect: number;
  @bits(2, 3) charSetASelect: number;
  @bits(4) csbs2: number;
  @bits(5) csas2: number;
}

/**
 * Sequencer Memory Mode Register (Index 04h)
 *
 * @export
 * @class SequencerMemModeReg
 * @extends {UnionStruct}
 */
export class SequencerMemModeReg extends UnionStruct {
  @bits(1) extendedMemory: number;
  @bits(2) oddEventHostMemWriteAddressDisable: number;
  @bits(3) chain4: number;
}

/**
 * Group of sequencer regs
 *
 * @export
 * @class VGASequencerRegs
 */
export class VGASequencerRegs {
  resetReg = new ResetReg;
  clockingModeReg = new ClockingModeReg;
  mapMaskReg = new MapMaskReg;
  charMapSelectReg = new CharMapSelectReg;
  memModeReg = new SequencerMemModeReg;

  /**
   * Returns two fonts charsets
   *
   * @returns {[MemoryRegionRange, MemoryRegionRange]}
   * @memberof VGASequencerRegs
   */
  getCharsetMemRegions(): [MemoryRegionRange, MemoryRegionRange] {
    const {
      charSetBSelect, csbs2,
      charSetASelect, csas2,
    } = this.charMapSelectReg;

    return [
      CHARSET_MEMORY_MAPS[(csas2 << 2) | charSetASelect],
      CHARSET_MEMORY_MAPS[(csbs2 << 2) | charSetBSelect],
    ];
  }
}
