import { UnionStruct, bits } from '@ts-c-compiler/core';
import { GRAPHICS_MEMORY_MAPS, GraphicsWriteMode, VGAIndexedReg } from './VGAConstants';

/**
 * @see {@link http://www.osdever.net/FreeVGA/vga/graphreg.htm#06}
 *
 * Index 00h -- Set/Reset Register
 * Index 01h -- Enable Set/Reset Register
 * Index 02h -- Color Compare Register
 * Index 03h -- Data Rotate Register
 * Index 04h -- Read Map Select Register
 * Index 05h -- Graphics Mode Register
 * Index 06h -- Misc Graphics Register
 * Index 07h -- Color Don't Care Register
 * Index 08h -- Bit Mask Register
 */

/**
 * Set/Reset Register (Index 00h)
 */
export class SetResetReg extends UnionStruct {
  @bits(0, 3) setResetReg: number;
}

/**
 * Enable Set/Reset Register (Index 01h)
 */
export class EnableSetResetReg extends UnionStruct {
  @bits(0, 3) enableSetReset: number;
}

/**
 * Color Compare Register (Index 02h)
 */
export class ColorCompareReg extends UnionStruct {
  @bits(0, 3) colorCompare: number;
}

/**
 * Data Rotate Register (Index 03h)
 */
export class DataRotateReg extends UnionStruct {
  @bits(0, 2) rotateCount: number;
  @bits(3, 4) logicalOperation: GraphicsWriteMode;
}

/**
 * Read Map Select Register (Index 04h)
 */
export class ReadMapSelectReg extends UnionStruct {
  @bits(0, 1) readMapSelect: number;
}

/**
 * Graphics Mode Register (Index 05h)
 */
export class GraphicsModeReg extends UnionStruct {
  @bits(0, 1) writeMode: GraphicsWriteMode;
  @bits(3) readMode: number;
  @bits(4) hostOddEvenMemoryReadAddrEnable: number;
  @bits(5) shiftRegInterleaveMode: number;
  @bits(6) shift256ColorMode: number;
}

/**
 * Misc Graphics Register (Index 06h)
 */
export type MemoryMapSelectType = keyof typeof GRAPHICS_MEMORY_MAPS;

export class MiscGraphicsReg extends UnionStruct {
  @bits(0) alphanumericModeDisable: number;
  @bits(1) chainOddEvenEnable: number;
  @bits(2, 3) memoryMapSelect: MemoryMapSelectType;
}

/**
 * Color Don't Care Register (Index 07h)
 */
export class ColorDontCareReg extends UnionStruct {
  @bits(0, 3) colorDontCare: number;
}

/**
 * Bit Mask Register (Index 08h)
 */
export class ColorBitmaskReg extends UnionStruct {
  @bits(0, 7) bitmask: number;
}

/**
 * Group of VGA Graphics Regs
 */
export class VGAGraphicsRegs extends VGAIndexedReg {
  setResetReg = new SetResetReg();
  enableSetResetReg = new EnableSetResetReg();
  colorCompareReg = new ColorCompareReg();
  dataRotateReg = new DataRotateReg();
  readMapSelectReg = new ReadMapSelectReg();
  graphicsModeReg = new GraphicsModeReg();
  miscGraphicsReg = new MiscGraphicsReg();
  colorDontCareReg = new ColorDontCareReg();
  colorBitmaskReg = new ColorBitmaskReg();

  getRegByIndex(index: number = this.indexReg): number {
    switch (index) {
      case 0x0:
        return this.setResetReg.number;
      case 0x1:
        return this.enableSetResetReg.number;
      case 0x2:
        return this.colorCompareReg.number;
      case 0x3:
        return this.dataRotateReg.number;
      case 0x4:
        return this.readMapSelectReg.number;
      case 0x5:
        return this.graphicsModeReg.number;
      case 0x6:
        return this.miscGraphicsReg.number;
      case 0x7:
        return this.colorDontCareReg.number;
      case 0x8:
        return this.colorBitmaskReg.number;

      default:
        return null;
    }
  }

  setRegByIndex(value: number, index: number = this.indexReg): void {
    switch (index) {
      case 0x0:
        this.setResetReg.number = value;
        break;
      case 0x1:
        this.enableSetResetReg.number = value;
        break;
      case 0x2:
        this.colorCompareReg.number = value;
        break;
      case 0x3:
        this.dataRotateReg.number = value;
        break;
      case 0x4:
        this.readMapSelectReg.number = value;
        break;
      case 0x5:
        this.graphicsModeReg.number = value;
        break;
      case 0x6:
        this.miscGraphicsReg.number = value;
        break;
      case 0x7:
        this.colorDontCareReg.number = value;
        break;
      case 0x8:
        this.colorBitmaskReg.number = value;
        break;

      default:
    }
  }
}
