import * as R from 'ramda';

import { UnionStruct, bits } from '@ts-c-compiler/core';
import { VGAIndexedReg } from './VGAConstants';

/** @see {@link http://www.osdever.net/FreeVGA/vga/attrreg.htm} */

/**
 * Attribute Address Register(3C0h)
 */
export class AttributeAddressReg extends UnionStruct {
  @bits(0, 4) attrAddress: number;
  @bits(5) pas: number;
}

/**
 * Attribute Mode Control Register (Index 10h)
 */
export class AttributeModeControlReg extends UnionStruct {
  @bits(0) atge: number;
  @bits(1) mono: number;
  @bits(2) lge: number;
  @bits(3) blink: number;
  @bits(5) ppm: number;
  @bits(6) bit8: number;
  @bits(7) p54s: number;
}

/**
 * Color Plane Enable Register (Index 12h)
 */
export class ColorPlaneEnableReg extends UnionStruct {
  @bits(0, 3) colorPlaneEnable: number;
}

/**
 * Horizontal Pixel Panning Register (Index 13h)
 */
export class HorizontalPixelPanningReg extends UnionStruct {
  @bits(0, 3) pixelShiftCount: number;
}

/**
 * Color Select Register (Index 14h)
 */
export class ColorSelectReg extends UnionStruct {
  @bits(0, 1) colorSelect54: number;
  @bits(2, 3) colorSelect76: number;
}

/**
 * Group of VGA Attribute regs
 */
export class VGAAttrRegs extends VGAIndexedReg {
  next3c0IsIndex = false; /* check 0x3DA port behaviour */
  attrAddressReg = new AttributeAddressReg();
  paletteRegs: number[] = R.repeat(
    0,
    16,
  ); /* Palette Registers (Index 00-0Fh) */
  attrModeControlReg = new AttributeModeControlReg();
  overscanColorReg = 0;
  colorPlaneEnableReg = new ColorPlaneEnableReg();
  horizontalPixelPanningReg = new HorizontalPixelPanningReg();
  colorSelectReg = new ColorSelectReg();

  isBlinkEnabled() {
    return this.attrModeControlReg.blink === 1;
  }

  getRegByIndex(index: number = this.indexReg): number {
    if (index >= 0x0 && index <= 0xf) {
      return this.paletteRegs[index];
    }

    switch (index) {
      case 0x10:
        return this.attrModeControlReg.number;
      case 0x11:
        return this.overscanColorReg;
      case 0x12:
        return this.colorPlaneEnableReg.number;
      case 0x13:
        return this.horizontalPixelPanningReg.number;
      case 0x14:
        return this.colorSelectReg.number;

      default:
        return null;
    }
  }

  setRegByIndex(value: number, index: number = this.indexReg): void {
    if (index >= 0x0 && index <= 0xf) {
      this.paletteRegs[index] = value;
      return;
    }

    switch (index) {
      case 0x10:
        this.attrModeControlReg.number = value;
        break;
      case 0x11:
        this.overscanColorReg = value;
        break;
      case 0x12:
        this.colorPlaneEnableReg.number = value;
        break;
      case 0x13:
        this.horizontalPixelPanningReg.number = value;
        break;
      case 0x14:
        this.colorSelectReg.number = value;
        break;
      default:
    }
  }
}
