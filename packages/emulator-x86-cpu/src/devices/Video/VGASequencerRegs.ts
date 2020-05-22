import {UnionStruct, bits} from '@compiler/core/shared/UnionStruct';
import {
  MemoryRegionsMap,
  MemoryRegionRange,
} from '@emulator/x86-cpu/memory/MemoryRegion';

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
  @bits(0) dotMode9or8: number;
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

export const CHARSET_MEMORY_MAPS: MemoryRegionsMap = Object.freeze(
  {
    0b000: new MemoryRegionRange(0x0000, 0x1FFF),
    0b001: new MemoryRegionRange(0x4000, 0x5FFF),
    0b010: new MemoryRegionRange(0x8000, 0x9FFF),
    0b011: new MemoryRegionRange(0xC000, 0xDFFF),
    0b100: new MemoryRegionRange(0x2000, 0x3FFF),
    0b101: new MemoryRegionRange(0x6000, 0x7FFF),
    0b110: new MemoryRegionRange(0xA000, 0xBFFF),
    0b111: new MemoryRegionRange(0xE000, 0xFFFF),
  },
);

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
  sequencerMemModeReg = new SequencerMemModeReg;
}
