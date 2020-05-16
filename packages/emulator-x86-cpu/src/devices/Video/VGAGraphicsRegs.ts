import {UnionStruct, bits} from '@compiler/core/shared/UnionStruct';
import {MemoryRegionRange} from '@emulator/x86-cpu/memory/MemoryRegion';

/**
 * @see {@link http://www.osdever.net/FreeVGA/vga/graphreg.htm#06}
 *
 * Index 00h -- Set/Reset Register
 * Index 01h -- Enable Set/Reset Register
 * Index 02h -- Color Compare Register
 * Index 03h -- Data Rotate Register
 * Index 04h -- Read Map Select Register
 * Index 05h -- Graphics Mode Register
 * Index 06h -- Miscellaneous Graphics Register
 * Index 07h -- Color Don't Care Register
 * Index 08h -- Bit Mask Register
 */

/**
 * Set/Reset Register (Index 00h)
 *
 * @export
 * @class SetResetReg
 * @extends {UnionStruct}
 */
export class SetResetReg extends UnionStruct {
  @bits(0, 3) setResetReg: number;
}

/**
 * Enable Set/Reset Register (Index 01h)
 *
 * @export
 * @class EnableSetResetReg
 * @extends {UnionStruct}
 */
export class EnableSetResetReg extends UnionStruct {
  @bits(0, 3) enableSetReset: number;
}

/**
 * Color Compare Register (Index 02h)
 *
 * @export
 * @class ColorCompareReg
 * @extends {UnionStruct}
 */
export class ColorCompareReg extends UnionStruct {
  @bits(0, 3) colorCompare: number;
}

/**
 * Data Rotate Register (Index 03h)
 *
 * @export
 * @class DataRotateReg
 * @extends {UnionStruct}
 */
export enum RotateRegLogicalOp {
  UNMODIFIED = 0b00,
  AND_LATCH = 0b01,
  OR_LATCH = 0b10,
  XOR_LATCH = 0b11,
}

export class DataRotateReg extends UnionStruct {
  @bits(0, 2) rotateCount: number;
  @bits(3, 4) logicalOperation: RotateRegLogicalOp;
}

/**
 * Read Map Select Register (Index 04h)
 *
 * @export
 * @class ReadMapSelectReg
 * @extends {UnionStruct}
 */
export class ReadMapSelectReg extends UnionStruct {
  @bits(0, 1) readMapSelect: number;
}

/**
 * Graphics Mode Register (Index 05h)
 *
 * @export
 * @class GraphicsModeReg
 * @extends {UnionStruct}
 */
export enum GraphicsWriteMode {
  MODE_0 = 0b00,
  MODE_1 = 0b01,
  MODE_2 = 0b10,
  MODE_3 = 0b11,
}

export class GraphicsModeReg extends UnionStruct {
  @bits(0, 1) writeMode: GraphicsWriteMode;
  @bits(3) readMode: number;
  @bits(4) hostOddEventMemoryReadAddrEnable: number;
  @bits(5) shiftRegInterleaveMode: number;
  @bits(6) shift256ColorMode: number;
}

/**
 * Miscellaneous Graphics Register (Index 06h)
 *
 * @export
 * @class MiscellaneousGraphicsReg
 * @extends {UnionStruct}
 */
export const GRAPHICS_MEMORY_MAPS: {[key: number]: MemoryRegionRange} = {
  0b00: new MemoryRegionRange(0xA0000, 0xBFFFF), // 128K region
  0b01: new MemoryRegionRange(0xA0000, 0xAFFFF), // 64K region
  0b10: new MemoryRegionRange(0xB0000, 0xB7FFF), // 32K region
  0b11: new MemoryRegionRange(0xB8000, 0xBFFFF), // 32K region
};

export class MiscellaneousGraphicsReg extends UnionStruct {
  @bits(0) alphanumericModeDisable: number;
  @bits(1) chainOddEvenEnable: number;
  @bits(2, 3) memoryMapSelect: keyof typeof GRAPHICS_MEMORY_MAPS;
}

/**
 * Color Don't Care Register (Index 07h)
 *
 * @export
 * @class ColorDontCareReg
 * @extends {UnionStruct}
 */
export class ColorDontCareReg extends UnionStruct {
  @bits(0, 3) colorDontCare: number;
}

/**
 * Bit Mask Register (Index 08h)
 *
 * @export
 * @class ColorBitmaskReg
 * @extends {UnionStruct}
 */
export class ColorBitmaskReg extends UnionStruct {
  @bits(0, 7) bitMask: number;
}

/**
 * Group of VGA Graphics Regs
 *
 * @export
 * @class VGAGraphicsRegs
 */
export class VGAGraphicsRegs {
  setResetReg = new SetResetReg;
  enableSetResetReg = new EnableSetResetReg;
  colorCompareReg = new ColorCompareReg;
  dataRotateReg = new DataRotateReg;
  readMapSelectReg = new ReadMapSelectReg;
  graphicsModeReg = new GraphicsModeReg;
  miscellaneousGraphicsReg = new MiscellaneousGraphicsReg;
  colorDontCareReg = new ColorDontCareReg;
  colorBitmaskReg = new ColorBitmaskReg;
}
